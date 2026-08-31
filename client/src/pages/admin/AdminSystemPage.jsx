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
