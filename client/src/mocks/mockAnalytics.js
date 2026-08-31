export const mockAnalytics = {
  overview: {
    totalUsers: 1420,
    totalContent: 6840,
    activeJobs: 12,
    completedJobs: 6790,
    failedJobs: 38,
    aiRequests: 248900,
    totalStorageBytes: 4294967296000, // ~4.29 TB
    estimatedCostUsd: 1482.50,
    systemHealth: 'HEALTHY'
  },
  dailyUploads: [
    { date: 'Aug 25', uploads: 184, hours: 92 },
    { date: 'Aug 26', uploads: 210, hours: 114 },
    { date: 'Aug 27', uploads: 265, hours: 148 },
    { date: 'Aug 28', uploads: 310, hours: 172 },
    { date: 'Aug 29', uploads: 295, hours: 160 },
    { date: 'Aug 30', uploads: 240, hours: 130 },
    { date: 'Aug 31', uploads: 342, hours: 198 }
  ],
  contentTypesBreakdown: [
    { type: 'Meetings', percentage: 48, count: 3280, color: '#171e19' },
    { type: 'Lectures', percentage: 24, count: 1640, color: '#9f8d8b' },
    { type: 'Interviews', percentage: 16, count: 1095, color: '#b7c6c2' },
    { type: 'Podcasts & Other', percentage: 12, count: 825, color: '#302b2f' }
  ],
  systemServices: [
    { name: 'API Gateway (Node/Express)', status: 'ONLINE', latencyMs: 24, uptime: '99.98%' },
    { name: 'MongoDB Atlas Cluster', status: 'ONLINE', latencyMs: 12, uptime: '99.99%' },
    { name: 'Atlas Vector Search Engine', status: 'ONLINE', latencyMs: 38, uptime: '99.95%' },
    { name: 'Python AI Engine (FastAPI)', status: 'ONLINE', latencyMs: 180, uptime: '99.90%' },
    { name: 'BullMQ Worker Pool (Redis)', status: 'HEALTHY', activeWorkers: 8, uptime: '100%' },
    { name: 'AWS S3 Storage Ingress', status: 'ONLINE', latencyMs: 45, uptime: '99.99%' }
  ]
};
