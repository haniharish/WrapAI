import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { LoadingState } from '../../components/common/LoadingState.jsx';

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

  if (isLoading) return <LoadingState message="POLLING USAGE METRICS..." />;

  const daily = analytics?.dailyUploads || [];
  const breakdown = analytics?.contentTypesBreakdown || [];

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="border-b border-[#444343] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            AGGREGATED INSIGHTS
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#E3E2DE]">
            ANALYTICS & <br />
            <span className="text-[#1351AA]">USAGE TRENDS.</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Upload Trend Chart */}
        <div className="bg-black/40 border border-[#444343] p-8 space-y-6">
          <h3 className="text-xl font-bold uppercase tracking-tight text-[#E3E2DE]">
            DAILY INGESTION VOLUME (LAST 7 DAYS)
          </h3>
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#444343]">
            {daily.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-mono text-[#1351AA] font-bold opacity-0 group-hover:opacity-100 mb-1">
                  {d.uploads}
                </span>
                <div
                  className="w-full bg-[#1351AA] hover:bg-white transition-colors duration-300"
                  style={{ height: `${Math.max(10, (d.uploads / 360) * 100)}%` }}
                />
                <span className="text-[10px] font-mono text-[#7A7A7A] mt-2 uppercase">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Type Breakdown */}
        <div className="bg-black/40 border border-[#444343] p-8 space-y-6">
          <h3 className="text-xl font-bold uppercase tracking-tight text-[#E3E2DE]">
            CONTENT TYPE DISTRIBUTION
          </h3>
          <div className="space-y-5 pt-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-[#7A7A7A]">
                  <span className="uppercase font-bold text-[#E3E2DE]">{item.type}</span>
                  <span className="text-[#1351AA] font-bold">{item.percentage}% ({item.count} ASSETS)</span>
                </div>
                <div className="w-full h-2 bg-[#141414] border border-[#444343]">
                  <div
                    className="h-full bg-[#1351AA]"
                    style={{ width: `${item.percentage}%` }}
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

export default AdminAnalyticsPage;
