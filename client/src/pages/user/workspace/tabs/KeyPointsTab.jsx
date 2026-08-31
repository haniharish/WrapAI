import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { Play } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function KeyPointsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        const intel = res.data || res;
        setPoints(intel?.keyPoints || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="EXTRACTING KEY POINTS..." />;

  if (!points || points.length === 0) {
    return (
      <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center text-[#7A7A7A] font-mono text-xs">
        NO KEY POINTS EXTRACTED YET.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="KEY STATEMENTS" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            {points.length} EXTRACTED STATEMENTS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
            {points.map((kp, idx) => {
              const text = kp.text || kp.statement;
              const speaker = kp.speakerName || kp.speaker || 'SPEAKER';
              const timestamp = kp.timestamp !== undefined ? kp.timestamp : (kp.startTime || 0);

              return (
                <div
                  key={kp.id || idx}
                  className="py-6 px-4 bg-white/40 hover:bg-white/80 transition-colors duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start space-x-4">
                    <span className="font-mono text-sm font-bold text-[#7A7A7A] group-hover:text-[#1351AA]">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-[#141414] leading-relaxed">
                        {text}
                      </p>
                      <div className="flex items-center space-x-3 text-xs font-mono text-[#7A7A7A]">
                        <span className="font-bold text-[#141414] uppercase">{speaker}</span>
                        {kp.category && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{kp.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase ${
                      kp.importance === 'HIGH' ? 'bg-[#1351AA] text-[#E3E2DE]' : 'bg-[#E3E2DE] text-[#141414] border border-[#C7C7C7]'
                    }`}>
                      {kp.importance || 'MEDIUM'}
                    </span>
                    <button
                      onClick={() => dispatch(seekPlayback(timestamp))}
                      className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-2.5 py-1 transition-colors cursor-pointer"
                      title="Jump to key point in media player"
                    >
                      <Play className="w-2.5 h-2.5 mr-1.5 text-[#1351AA]" />
                      {formatTimecode(timestamp)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyPointsTab;
