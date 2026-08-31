export const mockProcessingJobs = [
  {
    id: 'job_10495',
    contentId: 'cnt_06',
    contentTitle: 'Keynote Address — Modern Cloud Native Infrastructure',
    user: 'Rahul Sharma',
    userEmail: 'rahul@wrapai.io',
    contentType: 'URL',
    currentStage: 'TRANSCRIPTION',
    progress: 68,
    startedAt: '2026-08-31T07:10:00.000Z',
    status: 'Processing',
    durationSeconds: 142,
    stages: [
      { name: 'UPLOAD', status: 'COMPLETED', progress: 100, label: 'Upload Complete' },
      { name: 'AUDIO_EXTRACTION', status: 'COMPLETED', progress: 100, label: '16kHz Audio Extracted' },
      { name: 'TRANSCRIPTION', status: 'RUNNING', progress: 68, label: 'Whisper Transcribing (68%)' },
      { name: 'SPEAKER_ANALYSIS', status: 'PENDING', progress: 0, label: 'Speaker Diarization' },
      { name: 'AI_ANALYSIS', status: 'PENDING', progress: 0, label: 'Structured Intelligence' },
      { name: 'REPORT', status: 'PENDING', progress: 0, label: 'Report Compilation' }
    ]
  },
  {
    id: 'job_10494',
    contentId: 'cnt_01',
    contentTitle: 'Q3 Engineering Sync — Database & Ingestion Architecture',
    user: 'Rahul Sharma',
    userEmail: 'rahul@wrapai.io',
    contentType: 'VIDEO',
    currentStage: 'REPORT',
    progress: 100,
    startedAt: '2026-08-28T10:30:00.000Z',
    status: 'Completed',
    durationSeconds: 218,
    stages: [
      { name: 'UPLOAD', status: 'COMPLETED', progress: 100 },
      { name: 'AUDIO_EXTRACTION', status: 'COMPLETED', progress: 100 },
      { name: 'TRANSCRIPTION', status: 'COMPLETED', progress: 100 },
      { name: 'SPEAKER_ANALYSIS', status: 'COMPLETED', progress: 100 },
      { name: 'AI_ANALYSIS', status: 'COMPLETED', progress: 100 },
      { name: 'REPORT', status: 'COMPLETED', progress: 100 }
    ]
  },
  {
    id: 'job_10493',
    contentId: 'cnt_99',
    contentTitle: 'Corrupted Stream Test Upload',
    user: 'Alexandre Dubois',
    userEmail: 'alex@polytechnique.fr',
    contentType: 'AUDIO',
    currentStage: 'AUDIO_EXTRACTION',
    progress: 24,
    startedAt: '2026-08-30T14:12:00.000Z',
    status: 'Failed',
    durationSeconds: 32,
    errorMessage: 'FFmpeg non-zero exit code: Invalid AAC audio stream header'
  }
];
