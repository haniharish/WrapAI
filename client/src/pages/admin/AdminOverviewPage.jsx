import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
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

  if (isLoading) return <LoadingState message="POLLING ADMINISTRATIVE METRICS..." />;

  const metricCards = [
    { label: 'TOTAL USERS', value: metrics?.totalUsers || 0, sub: '+12% THIS MONTH' },
    { label: 'TOTAL CONTENT', value: metrics?.totalContent || 0, sub: 'STORED MULTI-MODAL ASSETS' },
    { label: 'ACTIVE QUEUE JOBS', value: metrics?.activeJobs || 0, sub: 'BULLMQ WORKERS ACTIVE' },
    { label: 'AI INFERENCE CALLS', value: (metrics?.aiRequests || 0).toLocaleString(), sub: 'STT + LLM TOKENS' },
    { label: 'COMPLETED JOBS', value: metrics?.completedJobs || 0, sub: '99.4% SUCCESS RATE' },
    { label: 'FAILED JOBS', value: metrics?.failedJobs || 0, sub: 'RETRIES REQUIRED' },
    { label: 'STORAGE VOLUME', value: formatBytes(metrics?.totalStorageBytes || 0), sub: 'AWS S3 INGRESS' },
    { label: 'ESTIMATED AI SPEND', value: `$${metrics?.estimatedCostUsd || 0}`, sub: 'CURRENT BILLING CYCLE' }
  ];

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#444343] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            ADMIN TELEMETRY
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#E3E2DE]">
            SYSTEM <br />
            <span className="text-[#1351AA]">OVERVIEW.</span>
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            LIVE CLUSTER STATUS, DATABASE QUOTAS & INGESTION PERFORMANCE
          </p>
        </div>
      </div>

      {/* 2. 8 Metrics Matrix */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="CLUSTER METRICS" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            TELEMETRY REGISTRY
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((m, idx) => (
              <div key={idx} className="bg-black/40 border border-[#444343] p-6 space-y-2">
                <span className="font-mono text-xs text-[#7A7A7A] block font-bold">0{idx + 1}</span>
                <span className="font-mono text-xs uppercase text-[#7A7A7A] block">{m.label}</span>
                <p className="text-2xl sm:text-3xl font-black text-[#E3E2DE] tracking-tight">{m.value}</p>
                <span className="font-mono text-[10px] text-[#1351AA] block font-bold">{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverviewPage;
