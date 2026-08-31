import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { Play } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function HighlightsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        const intel = res.data || res;
        setHighlights(intel?.highlights || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="EXTRACTING KEY HIGHLIGHTS..." />;

  if (!highlights || highlights.length === 0) {
    return (
      <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center text-[#7A7A7A] font-mono text-xs">
        NO HIGHLIGHTS DETECTED FOR THIS CONTENT YET.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="KEY MOMENTS" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            {highlights.length} DETECTED HIGHLIGHTS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
            {highlights.map((hl, idx) => {
              const timestamp = hl.timestamp !== undefined ? hl.timestamp : (hl.startTime || 0);

              return (
                <div
                  key={hl.id || idx}
                  className="py-6 px-4 bg-white/40 hover:bg-white/80 transition-colors duration-200 space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-base font-black text-[#1351AA]">
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors">
                        {hl.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-3">
                      {hl.importance && (
                        <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase ${
                          hl.importance === 'HIGH' ? 'bg-[#1351AA] text-[#E3E2DE]' : 'bg-[#E3E2DE] text-[#141414] border border-[#C7C7C7]'
                        }`}>
                          {hl.importance}
                        </span>
                      )}
                      <button
                        onClick={() => dispatch(seekPlayback(timestamp))}
                        className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-2.5 py-1 transition-colors cursor-pointer"
                        title="Jump to highlight in media player"
                      >
                        <Play className="w-2.5 h-2.5 mr-1.5 text-[#1351AA]" />
                        {formatTimecode(timestamp)}
                      </button>
                    </div>
                  </div>

                  <p className="text-base text-[#444343] leading-relaxed font-sans pl-1">
                    {hl.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HighlightsTab;
