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
          <p className="font-display text-4xl text-brand-beige my-2">${metrics.estimatedCostUsd}</p>
          <span className="text-xs text-brand-sage/80 font-mono">Current billing period</span>
        </div>
      </div>
    </div>
  );
}
