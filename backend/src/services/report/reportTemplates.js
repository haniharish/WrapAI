/**
 * Report Templates Configuration — Phase 11
 * Defines report presets, section defaults, ordering, and template metadata.
 */

export const SECTION_DEFINITIONS = {
  SUMMARY: {
    id: 'SUMMARY',
    label: 'Executive Summary',
    description: 'High-level synthesis and key takeaways of the content.'
  },
  TOPICS: {
    id: 'TOPICS',
    label: 'Topics Discussed',
    description: 'Structured outline of topics with duration and timestamps.'
  },
  KEY_POINTS: {
    id: 'KEY_POINTS',
    label: 'Key Points',
    description: 'Core concepts and highlighted takeaways categorized by topic.'
  },
  DECISIONS: {
    id: 'DECISIONS',
    label: 'Agreed Decisions',
    description: 'Explicit agreements made with speaker consensus and timestamps.'
  },
  ACTION_ITEMS: {
    id: 'ACTION_ITEMS',
    label: 'Action Items & Assignments',
    description: 'Tasks assigned to participants with deadlines and statuses.'
  },
  QUESTIONS: {
    id: 'QUESTIONS',
    label: 'Questions & Inquiries',
    description: 'Questions raised during the session with answers where resolved.'
  },
  HIGHLIGHTS: {
    id: 'HIGHLIGHTS',
    label: 'Key Highlights',
    description: 'Critical moments and timestamps for fast video/audio navigation.'
  },
  PARTICIPANTS: {
    id: 'PARTICIPANTS',
    label: 'Participants & Speakers',
    description: 'Identified speakers, speaking share, and total turn counts.'
  },
  TRANSCRIPT: {
    id: 'TRANSCRIPT',
    label: 'Diarized Transcript',
    description: 'Speaker-labeled chronological minutes.'
  }
};

export const REPORT_TEMPLATES = {
  MEETING: {
    id: 'MEETING',
    type: 'MEETING_REPORT',
    name: 'Meeting Minutes & Action Items',
    description: 'Comprehensive meeting report featuring executive summary, decisions, task registry, and speaker attendance.',
    defaultSections: [
      'SUMMARY',
      'TOPICS',
      'DECISIONS',
      'ACTION_ITEMS',
      'KEY_POINTS',
      'QUESTIONS',
      'HIGHLIGHTS',
      'PARTICIPANTS'
    ],
    recommendedDetail: 'STANDARD'
  },
  EXECUTIVE: {
    id: 'EXECUTIVE',
    type: 'EXECUTIVE_SUMMARY',
    name: 'Executive Brief',
    description: 'Concise high-level overview focused on strategic outcomes, critical decisions, and executive risks.',
    defaultSections: [
      'SUMMARY',
      'TOPICS',
      'DECISIONS',
      'ACTION_ITEMS',
      'HIGHLIGHTS'
    ],
    recommendedDetail: 'BRIEF'
  },
  LECTURE: {
    id: 'LECTURE',
    type: 'LECTURE_NOTES',
    name: 'Lecture & Study Notes',
    description: 'Educational summary emphasizing core topics, explanations, key points, and review questions.',
    defaultSections: [
      'SUMMARY',
      'TOPICS',
      'KEY_POINTS',
      'QUESTIONS',
      'HIGHLIGHTS'
    ],
    recommendedDetail: 'STANDARD'
  },
  INTERVIEW: {
    id: 'INTERVIEW',
    type: 'INTERVIEW_REPORT',
    name: 'Interview Assessment',
    description: 'Evaluative overview tracking candidate responses, interview topics, and highlights.',
    defaultSections: [
      'SUMMARY',
      'PARTICIPANTS',
      'TOPICS',
      'KEY_POINTS',
      'QUESTIONS',
      'HIGHLIGHTS'
    ],
    recommendedDetail: 'DETAILED'
  },
  GENERAL: {
    id: 'GENERAL',
    type: 'GENERAL_REPORT',
    name: 'Standard Content Report',
    description: 'General-purpose content analysis suitable for podcasts, videos, webinars, and text uploads.',
    defaultSections: [
      'SUMMARY',
      'TOPICS',
      'KEY_POINTS',
      'HIGHLIGHTS',
      'PARTICIPANTS'
    ],
    recommendedDetail: 'STANDARD'
  }
};

/**
 * Resolve template by ID or alias.
 */
export function getTemplate(templateId = 'MEETING') {
  const normalized = (templateId || 'MEETING').toUpperCase();
  if (REPORT_TEMPLATES[normalized]) return REPORT_TEMPLATES[normalized];
  if (normalized.includes('EXEC')) return REPORT_TEMPLATES.EXECUTIVE;
  if (normalized.includes('LECTURE')) return REPORT_TEMPLATES.LECTURE;
  if (normalized.includes('INTERVIEW')) return REPORT_TEMPLATES.INTERVIEW;
  if (normalized.includes('GENERAL')) return REPORT_TEMPLATES.GENERAL;
  return REPORT_TEMPLATES.MEETING;
}
