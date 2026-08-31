export const mockChatSessions = {
  cnt_01: [
    {
      id: 'msg_01',
      sender: 'USER',
      message: 'What decision was made regarding the database and vector search?',
      timestamp: '2026-08-31T07:20:00.000Z'
    },
    {
      id: 'msg_02',
      sender: 'ASSISTANT',
      message: 'The team decided to natively adopt MongoDB Atlas for both relational document storage and 1536-dimensional vector search. This choice eliminates distributed transaction overhead and keeps query latency under 45 milliseconds when pre-filtered by tenant.',
      timestamp: '2026-08-31T07:20:03.000Z',
      citations: [
        {
          segmentId: 'seg_02',
          speaker: 'Sarah Jenkins',
          timestamp: 46,
          timecode: '00:00:46',
          excerpt: 'Given that our documents and metadata already live in Atlas, native vector search eliminates distributed transactions and reduces latency.'
        },
        {
          segmentId: 'seg_04',
          speaker: 'Rahul Sharma',
          timestamp: 166,
          timecode: '00:02:46',
          excerpt: 'Let us formally confirm MongoDB Atlas for both operational persistence and vector search.'
        }
      ]
    },
    {
      id: 'msg_03',
      sender: 'USER',
      message: 'Who is responsible for the BullMQ retry configuration and when is the deadline?',
      timestamp: '2026-08-31T07:22:00.000Z'
    },
    {
      id: 'msg_04',
      sender: 'ASSISTANT',
      message: 'Sarah Jenkins is assigned to finish the BullMQ worker retry and backoff configuration with a deadline of Friday, September 4th, 2026.',
      timestamp: '2026-08-31T07:22:02.000Z',
      citations: [
        {
          segmentId: 'seg_09',
          speaker: 'Rahul Sharma',
          timestamp: 581,
          timecode: '00:09:41',
          excerpt: 'Sarah, can you finish the BullMQ worker retry configuration by Friday, September 4th?'
        },
        {
          segmentId: 'seg_10',
          speaker: 'Sarah Jenkins',
          timestamp: 681,
          timecode: '00:11:21',
          excerpt: 'Understood Rahul. I have marked Friday on my calendar and will push the PR with integration tests.'
        }
      ]
    }
  ]
};
