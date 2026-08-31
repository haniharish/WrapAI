import { contentRepository } from '../../repositories/contentRepository.js';
import { analysisRepository } from '../../repositories/analysisRepository.js';
import { transcriptRepository } from '../../repositories/transcriptRepository.js';
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
    const [analysis, transcriptBundle] = await Promise.all([
      analysisRepository.findByContentId(contentId),
      transcriptRepository.findByContentId(contentId)
    ]);

    const transcript = transcriptBundle?.transcript || null;
    const speakers = transcriptBundle?.speakers || [];
    const segments = transcriptBundle?.segments || [];

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

    // 5. Build Section Blocks
    const sections = [];

    for (const secKey of activeSections) {
      if (!SECTION_DEFINITIONS[secKey]) continue;

      switch (secKey) {
        case 'SUMMARY': {
          let text = '';
          if (detailLevel === 'BRIEF') {
            text = analysis?.summary?.keyTakeaway || analysis?.summary?.short || 'No summary available.';
          } else if (detailLevel === 'DETAILED') {
            text = [
              analysis?.summary?.keyTakeaway ? `**Key Takeaway**: ${analysis.summary.keyTakeaway}` : '',
              analysis?.summary?.executive || analysis?.summary?.short || '',
              analysis?.summary?.overview ? `\n${analysis.summary.overview}` : ''
            ].filter(Boolean).join('\n\n');
          } else {
            text = analysis?.summary?.executive || analysis?.summary?.short || 'No summary available.';
          }

          sections.push({
            id: 'SUMMARY',
            title: 'Executive Summary',
            type: 'paragraph',
            content: text,
            keyTakeaway: analysis?.summary?.keyTakeaway || null
          });
          break;
        }

        case 'TOPICS': {
          let rawTopics = analysis?.topics || [];
          if (detailLevel === 'BRIEF') rawTopics = rawTopics.slice(0, 3);

          const items = rawTopics.map((t, idx) => ({
            sequence: t.sequence || idx + 1,
            title: t.title || `Topic ${idx + 1}`,
            summary: t.summary || '',
            keyTakeaway: t.keyTakeaway || '',
            startTime: t.startTime || 0,
            endTime: t.endTime || 0,
            timecode: formatTimecode(t.startTime || 0)
          }));

          if (items.length > 0) {
            sections.push({
              id: 'TOPICS',
              title: 'Key Topics Discussed',
              type: 'topics',
              items
            });
          }
          break;
        }

        case 'DECISIONS': {
          let rawDecisions = analysis?.decisions || [];
          if (detailLevel === 'BRIEF') rawDecisions = rawDecisions.slice(0, 3);

          const items = rawDecisions.map((d, idx) => ({
            id: `dec_${idx + 1}`,
            title: d.title || d.description || `Decision ${idx + 1}`,
            description: d.description || d.title || '',
            category: d.category || 'General',
            agreedBy: d.agreedByNames?.length ? d.agreedByNames : ['Consensus'],
            timestamp: d.timestamp || 0,
            timecode: formatTimecode(d.timestamp || 0)
          }));

          if (items.length > 0) {
            sections.push({
              id: 'DECISIONS',
              title: 'Agreed Decisions',
              type: 'decisions',
              items
            });
          }
          break;
        }

        case 'ACTION_ITEMS': {
          let rawActions = analysis?.actionItems || [];
          if (detailLevel === 'BRIEF') rawActions = rawActions.slice(0, 3);

          const items = rawActions.map((a, idx) => ({
            id: `act_${idx + 1}`,
            task: a.task || `Action Item ${idx + 1}`,
            owner: a.ownerName || 'Unassigned',
            deadline: a.deadlineRaw || 'Not specified',
            status: a.status || 'PENDING',
            timestamp: a.timestamp || 0,
            timecode: formatTimecode(a.timestamp || 0)
          }));

          if (items.length > 0) {
            sections.push({
              id: 'ACTION_ITEMS',
              title: 'Action Items & Assignments',
              type: 'action_items',
              items
            });
          }
          break;
        }

        case 'KEY_POINTS': {
          let rawKp = analysis?.keyPoints || [];
          if (detailLevel === 'BRIEF') rawKp = rawKp.slice(0, 4);

          const items = rawKp.map((kp) => ({
            text: kp.text || '',
            importance: kp.importance || 'MEDIUM',
            category: kp.category || 'General',
            speaker: kp.speakerName || 'Speaker',
            timestamp: kp.timestamp || 0,
            timecode: formatTimecode(kp.timestamp || 0)
          }));

          if (items.length > 0) {
            sections.push({
              id: 'KEY_POINTS',
              title: 'Key Points & Takeaways',
              type: 'key_points',
              items
            });
          }
          break;
        }

        case 'QUESTIONS': {
          const rawQ = analysis?.questions || [];
          const items = rawQ.map((q) => ({
            question: q.question || '',
            askedBy: q.askedBy || 'Participant',
            answered: q.answered ?? true,
            timestamp: q.timestamp || 0,
            timecode: formatTimecode(q.timestamp || 0)
          }));

          if (items.length > 0) {
            sections.push({
              id: 'QUESTIONS',
              title: 'Questions & Inquiries',
              type: 'questions',
              items
            });
          }
          break;
        }

        case 'HIGHLIGHTS': {
          const rawHl = analysis?.highlights || [];
          const items = rawHl.map((h) => ({
            title: h.title || '',
            description: h.description || '',
            importance: h.importance || 'HIGH',
            timestamp: h.timestamp || 0,
            timecode: formatTimecode(h.timestamp || 0)
          }));

          if (items.length > 0) {
            sections.push({
              id: 'HIGHLIGHTS',
              title: 'Important Highlights',
              type: 'highlights',
              items
            });
          }
          break;
        }

        case 'PARTICIPANTS': {
          if (includeParticipants && speakers.length > 0) {
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
          }
          break;
        }

        case 'TRANSCRIPT': {
          if (detailLevel === 'DETAILED' && segments.length > 0) {
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
          }
          break;
        }

        default:
          break;
      }
    }

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
