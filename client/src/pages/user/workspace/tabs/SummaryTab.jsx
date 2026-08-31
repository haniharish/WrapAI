import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { PosterButton } from '../../../../components/ui/PosterButton.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { RefreshCw } from 'lucide-react';

export function SummaryTab() {
  const { id } = useParams();
  const [intel, setIntel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeMsg, setReanalyzeMsg] = useState(null);

  const loadData = async () => {
    try {
      const res = await intelligenceService.getIntelligence(id);
      setIntel(res.data || res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setReanalyzeMsg(null);
    try {
      await intelligenceService.regenerateAnalysis(id);
      setReanalyzeMsg('RE-ANALYSIS JOB ENQUEUED! RESULTS WILL UPDATE AUTOMATICALLY.');
    } catch (err) {
      setReanalyzeMsg('FAILED TO TRIGGER RE-ANALYSIS.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (isLoading) return <LoadingState message="EXTRACTING EXECUTIVE SUMMARY..." />;

  const summary = intel?.summary;
  const takeaway = summary?.keyTakeaway || summary?.takeaway || 'Core conclusions extracted from discussion.';
  const executive = summary?.executive || summary?.executiveSummary || summary?.short || 'Executive summary compiled by WrapAI.';
  const detailed = summary?.detailed || summary?.detailedSummary || summary?.overview || '';
  const model = intel?.llmModel || 'gemini-2.5-flash';

  return (
    <div className="space-y-12">
      {/* 1. Model Provenance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white/70 border border-[#C7C7C7]">
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            LLM PROVENANCE ({model.toUpperCase()})
          </span>
          <span className="text-xs font-mono text-[#7A7A7A]">
            DETERMINISTIC EXTRACT TRACEABLE TO AUDIO SEGMENTS
          </span>
        </div>

        <PosterButton
          variant="outline"
          size="sm"
          onClick={handleReanalyze}
          disabled={isReanalyzing}
          icon={RefreshCw}
        >
          {isReanalyzing ? 'ENQUEUING...' : 'RE-ANALYZE WITH AI'}
        </PosterButton>
      </div>

      {reanalyzeMsg && (
        <div className="p-4 bg-[#1b6b36]/10 border border-[#1b6b36] text-[#1b6b36] text-xs font-mono">
          {reanalyzeMsg}
        </div>
      )}

      {/* 2. Core Takeaway */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="CORE TAKEAWAY" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            HIGH-PRIORITY CONCLUSION
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-[#141414] text-[#E3E2DE] p-6 sm:p-10 border border-[#141414] space-y-3">
          <span className="text-xs font-mono uppercase font-bold tracking-[0.2em] text-[#1351AA] block">
            SYNTHESIZED OUTCOME
          </span>
          <p className="text-xl sm:text-2xl font-bold leading-relaxed text-[#E3E2DE]">
            {takeaway}
          </p>
        </div>
      </div>

      {/* 3. Executive Summary */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="EXECUTIVE SUMMARY" index="02">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            COMPREHENSIVE ABSTRACT
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-4">
          <h3 className="text-2xl font-black uppercase tracking-tight text-[#141414]">
            DISCUSSION OVERVIEW
          </h3>
          <p className="text-base text-[#141414] leading-relaxed whitespace-pre-line font-sans">
            {executive}
          </p>
        </div>
      </div>

      {/* 4. Context & Background */}
      {detailed && (
        <div className="grid grid-cols-12 gap-8">
          <GridSidebarLabel label="DISCUSSION CONTEXT" index="03">
            <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
              EXTENDED BREAKDOWN
            </p>
          </GridSidebarLabel>

          <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-4">
            <h3 className="text-2xl font-black uppercase tracking-tight text-[#141414]">
              EXTENDED DETAILS
            </h3>
            <p className="text-base text-[#444343] leading-relaxed whitespace-pre-line font-sans">
              {detailed}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SummaryTab;
