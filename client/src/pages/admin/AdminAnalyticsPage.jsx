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
                  style={{ height: `${(d.uploads / 360) * 100}%` }}
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
