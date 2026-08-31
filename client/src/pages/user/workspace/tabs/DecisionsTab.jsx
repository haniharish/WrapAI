import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { Check, Play } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function DecisionsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [decisions, setDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        const intel = res.data || res;
        setDecisions(intel?.decisions || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="EXTRACTING EXPLICIT DECISIONS..." />;

  if (!decisions || decisions.length === 0) {
    return (
      <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center text-[#7A7A7A] font-mono text-xs">
        NO EXPLICIT DECISIONS DETECTED IN THIS RECORDING.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="DECISIONS REGISTRY" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            {decisions.length} RECORDED DECISIONS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
            {decisions.map((dec, idx) => {
              const title = dec.title || dec.decision;
              const description = dec.description || dec.context;
              const agreedBy = dec.agreedByNames || dec.participants || [];
              const timestamp = dec.timestamp || 0;

              return (
                <div
                  key={dec.id || idx}
                  className="py-6 px-4 bg-white/40 hover:bg-white/80 transition-colors duration-200 space-y-4 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-[#1b6b36] flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors">
                          {title}
                        </h3>
                        {dec.category && (
                          <span className="text-[10px] font-mono font-bold uppercase text-[#E3E2DE] bg-[#141414] px-2 py-0.5 mt-2 inline-block">
                            {dec.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => dispatch(seekPlayback(timestamp))}
                      className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-2.5 py-1 transition-colors cursor-pointer"
                      title="Jump to decision in media player"
                    >
                      <Play className="w-2.5 h-2.5 mr-1.5 text-[#1351AA]" />
                      {formatTimecode(timestamp)}
                    </button>
                  </div>

                  {description && (
                    <p className="text-base text-[#444343] leading-relaxed font-sans pl-8">
                      {description}
                    </p>
                  )}

                  {agreedBy && agreedBy.length > 0 && (
                    <div className="pl-8 pt-3 border-t border-[#C7C7C7] flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-[#7A7A7A] uppercase font-bold">
                        AGREED BY:
                      </span>
                      {agreedBy.map((p, pIdx) => (
                        <span key={pIdx} className="px-2.5 py-0.5 bg-[#E3E2DE] border border-[#C7C7C7] text-xs font-mono font-bold uppercase text-[#141414]">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DecisionsTab;
