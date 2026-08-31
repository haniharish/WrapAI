export const mockTranscripts = {
  cnt_01: {
    contentId: 'cnt_01',
    language: 'en',
    speakers: [
      { id: 'SPK_00', name: 'Rahul Sharma', color: '#302b2f', segmentCount: 18, duration: 1140 },
      { id: 'SPK_01', name: 'Sarah Jenkins', color: '#9f8d8b', segmentCount: 14, duration: 920 },
      { id: 'SPK_02', name: 'Alexandre Dubois', color: '#171e19', segmentCount: 12, duration: 1060 }
    ],
    segments: [
      {
        id: 'seg_01',
        startTime: 0,
        endTime: 45,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'Good morning everyone. Welcome to the Q3 engineering sync. Today we need to align on three major items: our MongoDB Atlas vector search integration, our background BullMQ queue strategy, and how we handle audio alignment with Whisper and pyannote.'
      },
      {
        id: 'seg_02',
        startTime: 46,
        endTime: 92,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'Thanks Rahul. On the database front, we evaluated running separate vector stores like Pinecone versus leveraging MongoDB Atlas Vector Search natively. Given that our documents and metadata already live in Atlas, native vector search eliminates distributed transactions and reduces latency.'
      },
      {
        id: 'seg_03',
        startTime: 93,
        endTime: 165,
        speakerId: 'SPK_02',
        speakerName: 'Alexandre Dubois',
        text: 'I completely agree with Sarah. We benchmarked 1536-dimensional OpenAI embeddings against Atlas vector indexes with cosine similarity. With a pre-filter on userId and contentId, query latency stays well below 45 milliseconds even with high concurrent loads.'
      },
      {
        id: 'seg_04',
        startTime: 166,
        endTime: 230,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'That is outstanding performance. Let us formally confirm MongoDB Atlas for both operational persistence and vector search. Next, let us discuss background processing. When users upload 500 megabyte video files, how are we preventing Node.js event loop blocks?'
      },
      {
        id: 'seg_05',
        startTime: 231,
        endTime: 315,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'We architected a dedicated BullMQ worker pool backed by Redis. Clients upload directly to S3 via presigned URLs. Once uploaded, the API enqueues a job into BullMQ. The background worker pulls the job, strips 16kHz mono audio via FFmpeg, and calls our Python FastAPI engine.'
      },
      {
        id: 'seg_06',
        startTime: 316,
        endTime: 410,
        speakerId: 'SPK_02',
        speakerName: 'Alexandre Dubois',
        text: 'In the Python service, we run Whisper large-v3 for word timestamps and pyannote 3.1 for speaker diarization. We wrote a temporal intersection algorithm that merges word tokens into speaker intervals with sub-second precision.'
      },
      {
        id: 'seg_07',
        startTime: 411,
        endTime: 490,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'What is our fallback strategy if the LLM produces invalid JSON during the structured intelligence extraction step?'
      },
      {
        id: 'seg_08',
        startTime: 491,
        endTime: 580,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'We enforce Pydantic schemas using OpenAI JSON mode. If validation fails, our service triggers an immediate single-shot self-correction retry with the error trace. If that fails, it falls back to a deterministic regex parser so user jobs never crash.'
      },
      {
        id: 'seg_09',
        startTime: 581,
        endTime: 680,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'Excellent. For deadlines: Sarah, can you finish the BullMQ worker retry configuration by Friday, September 4th? And Alexandre, please deliver the RAG cosine threshold benchmarks by Tuesday, September 8th.'
      },
      {
        id: 'seg_10',
        startTime: 681,
        endTime: 745,
        speakerId: 'SPK_01',
        speakerName: 'Sarah Jenkins',
        text: 'Understood Rahul. I have marked Friday on my calendar and will push the PR with integration tests.'
      },
      {
        id: 'seg_11',
        startTime: 746,
        endTime: 820,
        speakerId: 'SPK_02',
        speakerName: 'Alexandre Dubois',
        text: 'Tuesday works perfectly for me. I will also include the citation grounding score analysis in the report.'
      },
      {
        id: 'seg_12',
        startTime: 821,
        endTime: 900,
        speakerId: 'SPK_00',
        speakerName: 'Rahul Sharma',
        text: 'Great. Let us wrap up the meeting. Thank you team for the solid preparation.'
      }
    ]
  }
};
