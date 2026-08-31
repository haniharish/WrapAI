export const mockUsers = [
  {
    id: 'usr_01',
    fullName: 'Rahul Sharma',
    email: 'rahul@wrapai.io',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-01-15T09:30:00.000Z',
    storageUsedBytes: 1284505600, // ~1.28 GB
    storageLimitBytes: 5368709120, // 5 GB
    contentCount: 14,
    status: 'ACTIVE',
    timezone: 'UTC+05:30 (India Standard Time)'
  },
  {
    id: 'usr_02',
    fullName: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2025-11-20T14:15:00.000Z',
    storageUsedBytes: 3829000000,
    storageLimitBytes: 10737418240, // 10 GB
    contentCount: 42,
    status: 'ACTIVE',
    timezone: 'UTC-04:00 (Eastern Time)'
  },
  {
    id: 'usr_03',
    fullName: 'Alexandre Dubois',
    email: 'alex@polytechnique.fr',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-02-10T11:00:00.000Z',
    storageUsedBytes: 450000000,
    storageLimitBytes: 5368709120,
    contentCount: 5,
    status: 'ACTIVE',
    timezone: 'UTC+01:00 (Central European Time)'
  },
  {
    id: 'usr_04',
    fullName: 'Elena Rostova',
    email: 'elena@deepresearch.org',
    role: 'USER',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-02-28T16:45:00.000Z',
    storageUsedBytes: 980000000,
    storageLimitBytes: 5368709120,
    contentCount: 9,
    status: 'INACTIVE',
    timezone: 'UTC+03:00 (Moscow Standard Time)'
  }
];

export const mockCurrentUser = mockUsers[0];
