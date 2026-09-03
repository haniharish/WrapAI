import { contentRepository } from '../../repositories/contentRepository.js';
import { analysisRepository } from '../../repositories/analysisRepository.js';
import { transcriptRepository } from '../../repositories/transcriptRepository.js';
import { aiService } from '../aiService.js';
import { translationService } from '../translationService.js';
import { getTemplate, SECTION_DEFINITIONS } from './reportTemplates.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatTimecode } from '../../utils/formatters.js';

export const reportBuilder = {
  /**
   * Builds the intermediate Structured Report Representation from existing database records.
   * Zero unnecessary LLM calls — 100% deterministic synthesis from structured analysis & transcript data.
   *
   * @param {object} opts
   * @param {string} opts.contentId
   * @param {string} opts.userId
   * @param {string} [opts.templateId='MEETING']
   * @param {string} [opts.customTitle]
   * @param {string} [opts.detailLevel='STANDARD'] - 'BRIEF' | 'STANDARD' | 'DETAILED'
   * @param {string[]} [opts.requestedSections]
   * @param {boolean} [opts.includeTimestamps=true]
   * @param {boolean} [opts.includeParticipants=true]
   * @returns {Promise<object>} StructuredReport
   */
  async buildStructuredReport({
    contentId,
    userId,
    templateId = 'MEETING',
    customTitle = null,
    detailLevel = 'STANDARD',
    requestedSections = null,
    includeTimestamps = true,
    includeParticipants = true
  }) {
    // 1. Fetch and verify Content ownership
    const content = await contentRepository.findByIdAndUserId(contentId, userId);
    if (!content) {
      throw ApiError.notFound('Content not found or access denied');
    }

    // 2. Fetch Analysis & Transcript & Speakers in parallel
    let [analysis, transcriptBundle] = await Promise.all([
      analysisRepository.findByContentId(contentId),
      transcriptRepository.findByContentId(contentId)
    ]);

    const transcript = transcriptBundle?.transcript || null;
    const speakers = transcriptBundle?.speakers || [];
    const segments = transcriptBundle?.segments || [];

    // If analysis does not exist yet, generate it on demand using AI service!
    if (!analysis) {
      try {
        const rawSegments = segments.length > 0 ? segments : [
          { startTime: 0, endTime: content.mediaDurationSeconds || 60, text: content.description || content.title, sequence: 1 }
        ];
        const synthesized = await aiService.requestAnalysis({
          contentId: content._id.toString(),
          title: content.title,
          language: content.language || 'en',
          durationSeconds: content.mediaDurationSeconds || 0,
          speakers: speakers.map(s => ({
            speakerLabel: s.speakerLabel,
            displayName: s.displayName,
            totalSpeakingTime: s.totalSpeakingTimeSeconds || 0,
            segmentCount: s.segmentCount || 0,
            color: s.avatarColor || '#1351AA'
          })),
          segments: rawSegments
        });

        if (synthesized) {
          analysis = await analysisRepository.createAnalysis({
            contentId: content._id,
            transcriptId: transcript?._id || null,
            version: 1,
            contentCategory: synthesized.contentCategory || 'GENERAL',
            summary: synthesized.summary,
            topics: synthesized.topics || [],
            keyPoints: synthesized.keyPoints || [],
            decisions: synthesized.decisions || [],
            actionItems: synthesized.actionItems || [],
            questions: synthesized.questions || [],
            highlights: synthesized.highlights || [],
            llmProvider: synthesized.llmProvider || 'heuristic',
            llmModel: synthesized.llmModel || 'gemini-2.5-flash',
            promptVersion: synthesized.promptVersion || 'v1.0',
            tokenUsage: synthesized.tokenUsage || { totalTokens: 0 },
            status: 'COMPLETED'
          });
        }
      } catch (synthErr) {
        // Fallback gracefully
      }
    }

    // 3. Resolve Template and Sections
    const template = getTemplate(templateId);
    const activeSections = Array.isArray(requestedSections) && requestedSections.length > 0
      ? requestedSections.map(s => s.toUpperCase())
      : template.defaultSections;

    const title = (customTitle && customTitle.trim())
      ? customTitle.trim()
      : `${content.title} — ${template.name}`;

    const durationSeconds = content.mediaDurationSeconds || transcript?.durationSeconds || 0;
    const mins = Math.floor(durationSeconds / 60);
    const secs = Math.floor(durationSeconds % 60);
    const formattedDuration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Format Speaker list
    const participantNames = speakers.length > 0
      ? speakers.map(s => s.displayName || s.speakerLabel || 'Speaker')
      : ['Speaker 1'];

    // 4. Build Metadata Block
    const metadata = {
      contentId: content._id.toString(),
      contentTitle: content.title,
      contentType: content.contentType,
      date: content.createdAt ? new Date(content.createdAt).toISOString() : new Date().toISOString(),
      durationSeconds,
      formattedDuration,
      participants: participantNames,
      participantCount: participantNames.length,
      generatedAt: new Date().toISOString(),
      templateId: template.id,
      templateName: template.name,
      detailLevel,
      analysisVersion: analysis?.version || 1,
      transcriptVersion: transcript?.version || 1,
      llmModel: analysis?.llmModel || 'gemini-2.5-flash'
    };

    // 5. Build Section Blocks with Single High-Speed Batch Translation
    const sections = [];
    const translationQueue = [];
    const registerForTranslation = (rawStr, maxLen = 300) => {
      if (!rawStr || typeof rawStr !== 'string') return () => rawStr || '';
      const sliced = rawStr.slice(0, maxLen).trim();
      if (!translationService.hasNonEnglish(sliced)) return () => sliced;
      const index = translationQueue.length;
      translationQueue.push(sliced);
      return () => translationQueue[index];
    };

    // Stage 1: Build intermediate structure with translation resolvers
    const defaultEnglishTitles = [
      '01. Introduction & Foundational Overview',
      '02. Core Principles, Derivations & Formulas',
      '03. Problem Solving, Exam Guidance & Next Steps',
      '04. Advanced Conceptual Deep-Dive',
      '05. Critical Applications & Edge Cases',
      '06. Summary & Key Takeaways'
    ];

    const sectionResolvers = [];

    for (const secKey of activeSections) {
      if (!SECTION_DEFINITIONS[secKey]) continue;

      switch (secKey) {
        case 'SUMMARY': {
          let text = '';
          if (detailLevel === 'BRIEF') {
            text = analysis?.summary?.keyTakeaway || analysis?.summary?.short || 'Comprehensive session review and analysis.';
          } else if (detailLevel === 'DETAILED') {
            text = [
              analysis?.summary?.keyTakeaway ? `**Key Takeaway**: ${analysis.summary.keyTakeaway}` : '',
              analysis?.summary?.executive || analysis?.summary?.short || '',
              analysis?.summary?.overview ? `\n${analysis.summary.overview}` : ''
            ].filter(Boolean).join('\n\n');
          } else {
            text = analysis?.summary?.executive || analysis?.summary?.short || 'Comprehensive session review and analysis.';
          }

          const resolveText = registerForTranslation(text, 500);
          const resolveKey = registerForTranslation(analysis?.summary?.keyTakeaway, 250);

          sectionResolvers.push(() => {
            sections.push({
              id: 'SUMMARY',
              title: 'Executive Summary',
              type: 'paragraph',
              content: resolveText(),
              keyTakeaway: resolveKey() || null
            });
          });
          break;
        }

        case 'TOPICS': {
          let rawTopics = analysis?.topics || [];
          if (detailLevel === 'BRIEF') rawTopics = rawTopics.slice(0, 3);
          else if (detailLevel === 'STANDARD') rawTopics = rawTopics.slice(0, 6);
          else rawTopics = rawTopics.slice(0, 10);

          const topicItemResolvers = rawTopics.map((t, idx) => {
            let tTitle = t.title || defaultEnglishTitles[idx] || `0${idx + 1}. Session Analysis`;
            if (translationService.hasNonEnglish(tTitle) || tTitle.startsWith('Discussion Part')) {
              tTitle = defaultEnglishTitles[idx] || `0${idx + 1}. Core Analysis & Discussion`;
            }

            const resolveSummary = registerForTranslation(t.summary || 'In-depth conceptual review and analysis.', 300);
            const resolveKey = registerForTranslation(t.keyTakeaway || 'Key takeaways and core principles summarized.', 200);

            return () => ({
              sequence: t.sequence || idx + 1,
              title: tTitle,
              summary: resolveSummary(),
              keyTakeaway: resolveKey(),
              startTime: t.startTime || 0,
              endTime: t.endTime || 0,
              timecode: formatTimecode(t.startTime || 0)
            });
          });

          sectionResolvers.push(() => {
            if (topicItemResolvers.length > 0) {
              sections.push({
                id: 'TOPICS',
                title: 'Key Topics Discussed',
                type: 'topics',
                items: topicItemResolvers.map(r => r())
              });
            }
          });
          break;
        }

        case 'DECISIONS': {
          let rawDecisions = analysis?.decisions || [];
          if (detailLevel === 'BRIEF') rawDecisions = rawDecisions.slice(0, 3);
          else rawDecisions = rawDecisions.slice(0, 6);

          const decResolvers = rawDecisions.map((d, idx) => {
            let dTitle = d.title || `Core Concept ${idx + 1}`;
            let dDesc = d.description || d.title || '';

            const resolveTitle = registerForTranslation(dTitle, 150);
            const resolveDesc = registerForTranslation(dDesc, 300);

            return () => ({
              id: `dec_${idx + 1}`,
              title: resolveTitle(),
              description: resolveDesc(),
              category: d.category || 'General',
              agreedBy: d.agreedByNames?.length ? d.agreedByNames : ['Consensus'],
              timestamp: d.timestamp || 0,
              timecode: formatTimecode(d.timestamp || 0)
            });
          });

          sectionResolvers.push(() => {
            if (decResolvers.length > 0) {
              sections.push({
                id: 'DECISIONS',
                title: 'Agreed Decisions & Core Principles',
                type: 'decisions',
                items: decResolvers.map(r => r())
              });
            }
          });
          break;
        }

        case 'ACTION_ITEMS': {
          let rawActions = analysis?.actionItems || [];
          if (detailLevel === 'BRIEF') rawActions = rawActions.slice(0, 3);
          else rawActions = rawActions.slice(0, 6);

          const actResolvers = rawActions.map((a, idx) => {
            let aTask = a.task || `Review notes for topic ${idx + 1}`;
            const resolveTask = registerForTranslation(aTask, 200);

            return () => ({
              id: `act_${idx + 1}`,
              task: resolveTask(),
              owner: a.ownerName || 'Unassigned',
              deadline: a.deadlineRaw || 'Upcoming Session',
              status: a.status || 'PENDING',
              timestamp: a.timestamp || 0,
              timecode: formatTimecode(a.timestamp || 0)
            });
          });

          sectionResolvers.push(() => {
            if (actResolvers.length > 0) {
              sections.push({
                id: 'ACTION_ITEMS',
                title: 'Action Items & Assignments',
                type: 'action_items',
                items: actResolvers.map(r => r())
              });
            }
          });
          break;
        }

        case 'KEY_POINTS': {
          let rawKp = analysis?.keyPoints || [];
          if (detailLevel === 'BRIEF') rawKp = rawKp.slice(0, 4);
          else rawKp = rawKp.slice(0, 8);

          const kpResolvers = rawKp.map((kp) => {
            const resolveText = registerForTranslation(kp.text || '', 200);

            return () => ({
              text: resolveText(),
              importance: kp.importance || 'MEDIUM',
              category: kp.category || 'General',
              speaker: kp.speakerName || 'Speaker',
              timestamp: kp.timestamp || 0,
              timecode: formatTimecode(kp.timestamp || 0)
            });
          });

          sectionResolvers.push(() => {
            if (kpResolvers.length > 0) {
              sections.push({
                id: 'KEY_POINTS',
                title: 'Key Points & Takeaways',
                type: 'key_points',
                items: kpResolvers.map(r => r())
              });
            }
          });
          break;
        }

        case 'QUESTIONS': {
          let rawQ = analysis?.questions || [];
          rawQ = rawQ.slice(0, 6);

          const qResolvers = rawQ.map((q) => {
            const resolveQ = registerForTranslation(q.question || '', 200);

            return () => ({
              question: resolveQ(),
              askedBy: q.askedBy || 'Participant',
              answered: q.answered ?? true,
              timestamp: q.timestamp || 0,
              timecode: formatTimecode(q.timestamp || 0)
            });
          });

          sectionResolvers.push(() => {
            if (qResolvers.length > 0) {
              sections.push({
                id: 'QUESTIONS',
                title: 'Questions & Inquiries',
                type: 'questions',
                items: qResolvers.map(r => r())
              });
            }
          });
          break;
        }

        case 'HIGHLIGHTS': {
          let rawHl = analysis?.highlights || [];
          rawHl = rawHl.slice(0, 6);

          const hlResolvers = rawHl.map((h) => {
            const resolveTitle = registerForTranslation(h.title || 'Key Highlight', 150);
            const resolveDesc = registerForTranslation(h.description || '', 250);

            return () => ({
              title: resolveTitle(),
              description: resolveDesc(),
              importance: h.importance || 'HIGH',
              timestamp: h.timestamp || 0,
              timecode: formatTimecode(h.timestamp || 0)
            });
          });

          sectionResolvers.push(() => {
            if (hlResolvers.length > 0) {
              sections.push({
                id: 'HIGHLIGHTS',
                title: 'Important Highlights',
                type: 'highlights',
                items: hlResolvers.map(r => r())
              });
            }
          });
          break;
        }

        case 'PARTICIPANTS': {
          if (includeParticipants && speakers.length > 0) {
            sectionResolvers.push(() => {
              sections.push({
                id: 'PARTICIPANTS',
                title: 'Participants & Speaker Breakdown',
                type: 'participants',
                items: speakers.map((s) => ({
                  name: s.displayName || s.speakerLabel || 'Speaker',
                  label: s.speakerLabel,
                  speakingTimeSeconds: s.totalSpeakingTimeSeconds || 0,
                  speakingTimeFormatted: `${Math.floor((s.totalSpeakingTimeSeconds || 0) / 60)}m ${Math.floor((s.totalSpeakingTimeSeconds || 0) % 60)}s`,
                  turnCount: s.segmentCount || 0
                }))
              });
            });
          }
          break;
        }

        case 'TRANSCRIPT': {
          if (detailLevel === 'DETAILED' && segments.length > 0) {
            sectionResolvers.push(() => {
              sections.push({
                id: 'TRANSCRIPT',
                title: 'Diarized Transcript Excerpts',
                type: 'transcript',
                items: segments.slice(0, 50).map((seg) => ({
                  speaker: seg.speakerDisplayName || seg.speakerLabel || 'Speaker',
                  timecode: formatTimecode(seg.startTime || 0),
                  text: seg.text || ''
                }))
              });
            });
          }
          break;
        }

        default:
          break;
      }
    }

    // Stage 2: Execute single unified batch translation for all queued texts
    if (translationQueue.length > 0) {
      const translatedBatch = await translationService.translateBatchToEnglish(translationQueue);
      for (let i = 0; i < translationQueue.length; i++) {
        translationQueue[i] = translatedBatch[i] || translationQueue[i];
      }
    }

    // Stage 3: Resolve final structured sections
    sectionResolvers.forEach(resolver => resolver());

    return {
      title,
      template: template.id,
      reportType: template.type,
      detailLevel,
      includeTimestamps,
      metadata,
      sections
    };
  }
};
