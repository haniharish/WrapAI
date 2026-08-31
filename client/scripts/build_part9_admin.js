// client/scripts/build_part9_admin.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/pages/admin/AdminOverviewPage.jsx
write('src/pages/admin/AdminOverviewPage.jsx', `
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Card } from '../../components/ui/Card.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Users, Database, Cpu, CheckCircle2, AlertTriangle, Zap, HardDrive, ShieldCheck } from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

export function AdminOverviewPage() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getMetrics();
        setMetrics(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <LoadingState message="Loading administrative metrics..." />;

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-brand-charcoal">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">
          SYSTEM TELEMETRY
        </span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
          Admin Overview
        </h1>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">TOTAL USERS</p>
          <p className="font-display text-4xl text-brand-white my-2">{metrics.totalUsers}</p>
          <span className="text-xs text-brand-sage/80 font-mono">+12% this month</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">TOTAL CONTENT</p>
          <p className="font-display text-4xl text-brand-white my-2">{metrics.totalContent}</p>
          <span className="text-xs text-brand-sage/80 font-mono">Ingested media</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">ACTIVE QUEUE JOBS</p>
          <p className="font-display text-4xl text-brand-cyan my-2">{metrics.activeJobs}</p>
          <span className="text-xs text-brand-sage/80 font-mono">BullMQ workers active</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">AI API REQUESTS</p>
          <p className="font-display text-4xl text-brand-white my-2">{metrics.aiRequests.toLocaleString()}</p>
          <span className="text-xs text-brand-sage/80 font-mono">STT + LLM Tokens</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">COMPLETED JOBS</p>
          <p className="font-display text-4xl text-emerald-400 my-2">{metrics.completedJobs}</p>
          <span className="text-xs text-emerald-400 font-mono">99.4% success rate</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">FAILED JOBS</p>
          <p className="font-display text-4xl text-red-400 my-2">{metrics.failedJobs}</p>
          <span className="text-xs text-red-400 font-mono">Requires attention</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">STORAGE VOLUME</p>
          <p className="font-display text-4xl text-brand-white my-2">{formatBytes(metrics.totalStorageBytes)}</p>
          <span className="text-xs text-brand-sage/80 font-mono">AWS S3 Ingress</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <p className="text-xs font-mono uppercase text-brand-sage">ESTIMATED AI COST</p>
          <p className="font-display text-4xl text-brand-beige my-2">\${metrics.estimatedCostUsd}</p>
          <span className="text-xs text-brand-sage/80 font-mono">Current billing period</span>
        </div>
      </div>
    </div>
  );
}
`);

// 2. src/pages/admin/AdminUsersPage.jsx
write('src/pages/admin/AdminUsersPage.jsx', `
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Search, UserCheck, Shield, UserX, Trash2 } from 'lucide-react';
import { formatDate, formatBytes } from '../../utils/formatters.js';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers();
      setUsers(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleUserStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u))
    );
  };

  const toggleUserRole = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' } : u))
    );
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingState message="Loading user directory..." />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-charcoal">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">GOVERNANCE</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
          User Management
        </h1>
      </div>

      <div className="bg-brand-navy border border-brand-charcoal p-4 max-w-md">
        <Input
          icon={Search}
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-brand-charcoal text-white border-brand-charcoal"
        />
      </div>

      {/* Users Table */}
      <div className="bg-brand-navy border border-brand-charcoal overflow-x-auto">
        <table className="w-full text-left text-xs text-brand-light font-sans">
          <thead className="bg-black/30 border-b border-brand-charcoal uppercase font-mono text-[10px] text-brand-sage">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Content Count</th>
              <th className="p-4">Storage Used</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-charcoal">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-brand-charcoal/40 transition-colors">
                <td className="p-4 font-bold flex items-center space-x-3">
                  <img src={u.avatar} alt={u.fullName} className="w-7 h-7 object-cover" />
                  <div>
                    <p className="text-white">{u.fullName}</p>
                    <p className="text-[10px] font-mono text-brand-sage">{u.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={u.role === 'ADMIN' ? 'cyan' : 'default'}>{u.role}</Badge>
                </td>
                <td className="p-4 font-mono text-brand-sage">{formatDate(u.joinedAt)}</td>
                <td className="p-4 font-mono">{u.contentCount} items</td>
                <td className="p-4 font-mono">{formatBytes(u.storageUsedBytes)}</td>
                <td className="p-4">
                  <span
                    className={\`font-mono text-[10px] uppercase font-bold \${
                      u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                    }\`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-brand-charcoal text-brand-sage hover:text-white"
                    onClick={() => toggleUserStatus(u.id)}
                  >
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-brand-charcoal text-white"
                    onClick={() => toggleUserRole(u.id)}
                  >
                    Role: {u.role}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

// 3. src/pages/admin/AdminContentPage.jsx
write('src/pages/admin/AdminContentPage.jsx', `
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Input } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Search, Database, FileText } from 'lucide-react';
import { formatDate, formatBytes, formatTimecode } from '../../utils/formatters.js';

export function AdminContentPage() {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getContentMonitoring();
        setContentList(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <LoadingState message="Loading ingested content registry..." />;

  const filtered = contentList.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-charcoal">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">INGESTION REGISTRY</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
          Content Monitoring
        </h1>
      </div>

      <div className="bg-brand-navy border border-brand-charcoal p-4 max-w-md">
        <Input
          icon={Search}
          placeholder="Search all content titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-brand-charcoal text-white border-brand-charcoal"
        />
      </div>

      <div className="bg-brand-navy border border-brand-charcoal overflow-x-auto">
        <table className="w-full text-left text-xs text-brand-light font-sans">
          <thead className="bg-black/30 border-b border-brand-charcoal uppercase font-mono text-[10px] text-brand-sage">
            <tr>
              <th className="p-4">Content Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Size</th>
              <th className="p-4">Processing Status</th>
              <th className="p-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-charcoal">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-brand-charcoal/40 transition-colors">
                <td className="p-4 font-bold text-white max-w-xs truncate">{c.title}</td>
                <td className="p-4">
                  <Badge variant={c.contentType === 'VIDEO' ? 'blue' : 'sage'}>{c.contentType}</Badge>
                </td>
                <td className="p-4 font-mono text-brand-sage">
                  {c.mediaDurationSeconds ? formatTimecode(c.mediaDurationSeconds) : 'Document'}
                </td>
                <td className="p-4 font-mono">{formatBytes(c.fileSizeBytes)}</td>
                <td className="p-4">
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    {c.processingStatus}
                  </span>
                </td>
                <td className="p-4 font-mono text-brand-sage">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

// 4. src/pages/admin/AdminProcessingPage.jsx
write('src/pages/admin/AdminProcessingPage.jsx', `
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { RefreshCw, Play, XOctagon } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function AdminProcessingPage() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getJobs();
        setJobs(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleRetry = (jobId) => {
    alert(\`Re-enqueued Job \${jobId} to BullMQ queue.\`);
  };

  if (isLoading) return <LoadingState message="Loading BullMQ queue inspector..." />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-charcoal flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">BULLMQ QUEUE TELEMETRY</span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
            Processing Monitor
          </h1>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} className="border-brand-charcoal text-white">
          Refresh Queue
        </Button>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-brand-navy border border-brand-charcoal p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-xs font-bold text-brand-cyan">{job.id}</span>
                  <span className="text-brand-charcoal">|</span>
                  <Badge variant={job.status === 'Completed' ? 'success' : job.status === 'Failed' ? 'danger' : 'warning'}>
                    {job.status}
                  </Badge>
                </div>
                <h3 className="font-display text-xl uppercase tracking-wide text-brand-white">
                  {job.contentTitle}
                </h3>
                <p className="text-xs font-mono text-brand-sage mt-0.5">
                  User: {job.user} ({job.userEmail}) | Started: {formatDate(job.startedAt)}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {job.status === 'Failed' && (
                  <Button variant="primary" size="sm" onClick={() => handleRetry(job.id)} icon={RefreshCw}>
                    Retry Job
                  </Button>
                )}
              </div>
            </div>

            <ProgressBar progress={job.progress} label={\`Current Stage: \${job.currentStage}\`} className="text-white" />

            {job.errorMessage && (
              <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-xs font-mono text-red-300">
                ERROR: {job.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
`);

// 5. src/pages/admin/AdminAnalyticsPage.jsx
write('src/pages/admin/AdminAnalyticsPage.jsx', `
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Card } from '../../components/ui/Card.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getAnalytics();
        setAnalytics(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <LoadingState message="Loading analytical visualizations..." />;

  const daily = analytics?.dailyUploads || [];
  const breakdown = analytics?.contentTypesBreakdown || [];

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-brand-charcoal">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">AGGREGATED INSIGHTS</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
          Analytics & Usage Trends
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Upload Trend Chart Visualization */}
        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <h3 className="font-display text-xl uppercase tracking-wide text-brand-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-brand-cyan" /> Daily Ingestion Volume (Last 7 Days)
          </h3>
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-brand-charcoal">
            {daily.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="text-[10px] font-mono text-brand-cyan opacity-0 group-hover:opacity-100 mb-1">
                  {d.uploads}
                </div>
                <div
                  className="w-full bg-brand-cyan hover:bg-white transition-all duration-300"
                  style={{ height: \`\${(d.uploads / 360) * 100}%\` }}
                />
                <span className="text-[10px] font-mono text-brand-sage mt-2">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Type Breakdown */}
        <div className="bg-brand-navy border border-brand-charcoal p-6">
          <h3 className="font-display text-xl uppercase tracking-wide text-brand-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-brand-beige" /> Content Types Distribution
          </h3>
          <div className="space-y-4 pt-2">
            {breakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-mono text-brand-sage mb-1">
                  <span>{item.type}</span>
                  <span className="text-white font-bold">{item.percentage}% ({item.count} files)</span>
                </div>
                <div className="w-full h-2 bg-brand-charcoal">
                  <div
                    className="h-full bg-brand-sage"
                    style={{ width: \`\${item.percentage}%\` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`);

// 6. src/pages/admin/AdminSystemPage.jsx
write('src/pages/admin/AdminSystemPage.jsx', `
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Terminal, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';

export function AdminSystemPage() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getSystemHealth();
        setServices(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <LoadingState message="Probing infrastructure health endpoints..." />;

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-brand-charcoal flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">INFRASTRUCTURE HEALTH</span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
            System Monitor
          </h1>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} className="border-brand-charcoal text-white">
          Check Health
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc, idx) => (
          <div key={idx} className="bg-brand-navy border border-brand-charcoal p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5">
                {svc.status}
              </span>
              <span className="text-xs font-mono text-brand-sage">{svc.uptime}</span>
            </div>

            <h3 className="font-display text-lg uppercase tracking-wide text-brand-white mb-2">
              {svc.name}
            </h3>

            <p className="text-xs font-mono text-brand-sage">
              LATENCY: <span className="text-brand-cyan">{svc.latencyMs}ms</span>
            </p>
          </div>
        ))}
      </div>

      {/* Structured Log Terminal Preview */}
      <div className="bg-black border border-brand-charcoal p-6">
        <div className="flex items-center space-x-2 text-brand-sage mb-4 pb-2 border-b border-brand-charcoal">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold uppercase">LIVE CLUSTER LOG STREAM (MOCK WINSTON / STRUCTLOG)</span>
        </div>
        <div className="font-mono text-xs text-brand-sage space-y-1.5 overflow-x-auto">
          <p><span className="text-brand-taupe">[2026-08-31T07:30:12Z]</span> <span className="text-emerald-400">[INFO]</span> api-gateway: POST /api/uploads/request-url 200 42ms</p>
          <p><span className="text-brand-taupe">[2026-08-31T07:30:15Z]</span> <span className="text-emerald-400">[INFO]</span> bullmq-worker: Claimed job 10495 (contentId: cnt_06)</p>
          <p><span className="text-brand-taupe">[2026-08-31T07:30:18Z]</span> <span className="text-emerald-400">[INFO]</span> ai-engine: FFmpeg audio normalized to 16kHz mono PCM</p>
          <p><span className="text-brand-taupe">[2026-08-31T07:30:45Z]</span> <span className="text-emerald-400">[INFO]</span> ai-engine: Whisper STT word timestamps aligned with pyannote</p>
          <p><span className="text-brand-taupe">[2026-08-31T07:31:02Z]</span> <span className="text-emerald-400">[INFO]</span> atlas-vector: 48 segments indexed with 1536-dim embeddings</p>
        </div>
      </div>
    </div>
  );
}
`);

console.log('Part 9 admin pages generated successfully.');
