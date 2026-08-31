import { mockDelay, createApiResponse } from './api.js';

export const reportService = {
  async getReports() {
    await mockDelay(250);
    return createApiResponse([
      {
        id: 'rep_01',
        contentId: 'cnt_01',
        title: 'Executive Minutes — Q3 Engineering Sync',
        contentTitle: 'Q3 Engineering Sync — Database & Ingestion Architecture',
        type: 'MEETING_MINUTES',
        date: '2026-08-28T11:25:00.000Z',
        status: 'Generated',
        sections: ['Executive Summary', 'Key Decisions', 'Action Items', 'Topics']
      },
      {
        id: 'rep_02',
        contentId: 'cnt_02',
        title: 'Lecture Digest — Distributed Consensus & Raft',
        contentTitle: 'CS-842: Distributed Consensus & Raft Protocols',
        type: 'LECTURE_NOTES',
        date: '2026-08-25T15:20:00.000Z',
        status: 'Generated',
        sections: ['Summary', 'Core Concepts', 'Decisions']
      },
      {
        id: 'rep_03',
        contentId: 'cnt_03',
        title: 'Candidate Evaluation — Sarah Chen',
        contentTitle: 'Staff AI Engineer Candidate Interview — Sarah Chen',
        type: 'INTERVIEW_SUMMARY',
        date: '2026-08-22T16:50:00.000Z',
        status: 'Viewed',
        sections: ['Summary', 'Competencies', 'Highlights']
      }
    ]);
  },

  async generateReport(contentId, config = {}) {
    await mockDelay(1200);
    return createApiResponse({
      id: `rep_${Date.now()}`,
      contentId,
      title: 'Compiled Intelligence Report',
      status: 'Generated',
      downloadUrl: '#'
    }, 'Report compiled successfully');
  }
};
