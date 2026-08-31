import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Terminal, RefreshCw } from 'lucide-react';

export function AdminSystemPage() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSystemHealth();
      setServices(res.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <LoadingState message="PROBING INFRASTRUCTURE ENDPOINTS..." />;

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="pb-8 border-b border-[#444343] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            INFRASTRUCTURE HEALTH
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#E3E2DE]">
            SYSTEM <br />
            <span className="text-[#1351AA]">MONITOR.</span>
          </h1>
        </div>
        <PosterButton variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
          PROBE HEALTH
        </PosterButton>
      </div>

      {/* 2. Microservice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc, idx) => (
          <div key={idx} className="bg-black/40 border border-[#444343] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#1b6b36] font-bold bg-[#1b6b36]/10 border border-[#1b6b36] px-2 py-0.5 uppercase">
                {svc.status}
              </span>
              <span className="text-xs font-mono text-[#7A7A7A] uppercase">{svc.uptime}</span>
            </div>

            <h3 className="text-xl font-bold uppercase tracking-tight text-[#E3E2DE]">
              {svc.name}
            </h3>

            <p className="text-xs font-mono text-[#7A7A7A]">
              LATENCY: <span className="text-[#1351AA] font-bold">{svc.latencyMs}MS</span>
            </p>
          </div>
        ))}
      </div>

      {/* 3. Structured Log Stream */}
      <div className="bg-black border border-[#444343] p-6 space-y-4">
        <div className="flex items-center space-x-2 text-[#7A7A7A] pb-3 border-b border-[#444343]">
          <Terminal className="w-4 h-4 text-[#1351AA]" />
          <span className="text-xs font-mono font-bold uppercase">LIVE CLUSTER LOG STREAM (WINSTON / STRUCTLOG)</span>
        </div>
        <div className="font-mono text-xs text-[#E3E2DE]/80 space-y-2 overflow-x-auto">
          <p><span className="text-[#7A7A7A]">[2026-08-31T07:30:12Z]</span> <span className="text-[#1b6b36]">[INFO]</span> api-gateway: POST /api/uploads/request-url 200 42ms</p>
          <p><span className="text-[#7A7A7A]">[2026-08-31T07:30:15Z]</span> <span className="text-[#1b6b36]">[INFO]</span> bullmq-worker: Claimed job 10495 (contentId: cnt_06)</p>
          <p><span className="text-[#7A7A7A]">[2026-08-31T07:30:18Z]</span> <span className="text-[#1b6b36]">[INFO]</span> ai-engine: FFmpeg audio normalized to 16kHz mono PCM</p>
          <p><span className="text-[#7A7A7A]">[2026-08-31T07:30:45Z]</span> <span className="text-[#1b6b36]">[INFO]</span> ai-engine: Whisper STT word timestamps aligned with pyannote</p>
          <p><span className="text-[#7A7A7A]">[2026-08-31T07:31:02Z]</span> <span className="text-[#1b6b36]">[INFO]</span> atlas-vector: 48 segments indexed with 1536-dim embeddings</p>
        </div>
      </div>
    </div>
  );
}

export default AdminSystemPage;
