import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export function SummaryTab() {
  const { id } = useParams();
  const [intel, setIntel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setIntel(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting summary insights..." />;

  const summary = intel?.summary;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Main Takeaway Callout */}
      <Card className="bg-brand-navy text-brand-white p-6 sm:p-8 border border-brand-charcoal">
        <div className="flex items-center space-x-2 text-brand-cyan mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-[11px] font-mono uppercase font-bold tracking-widest">CORE TAKEAWAY</span>
        </div>
        <p className="text-base sm:text-lg font-medium text-brand-light leading-relaxed">
          {summary?.takeaway}
        </p>
      </Card>

      {/* 2. Executive Summary */}
      <Card className="p-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-brand-navy" /> Executive Summary
        </h2>
        <p className="text-sm text-brand-charcoal leading-relaxed">
          {summary?.executive}
        </p>
      </Card>

      {/* 3. Detailed Summary */}
      <Card className="p-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy mb-4">
          Detailed Chronological Breakdown
        </h2>
        <p className="text-sm text-brand-charcoal leading-relaxed whitespace-pre-line">
          {summary?.detailed}
        </p>
      </Card>
    </div>
  );
}
