import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { Play } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function TopicsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        const intel = res.data || res;
        setTopics(intel?.topics || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="IDENTIFYING THEMATIC TOPICS..." />;

  const handleJump = (seconds) => {
    dispatch(seekPlayback(seconds));
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center text-[#7A7A7A] font-mono text-xs">
        NO THEMATIC TOPICS DETECTED FOR THIS CONTENT YET.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="THEMATIC CLUSTERS" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            {topics.length} DETECTED TOPICS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
            {topics.map((t, idx) => {
              const startTime = t.startTime !== undefined ? t.startTime : (t.timestamp || 0);
              const topicNum = t.sequence !== undefined ? String(t.sequence).padStart(2, '0') : (t.number || `0${idx + 1}`);

              return (
                <div
                  key={t.id || idx}
                  className="py-8 px-4 bg-white/40 hover:bg-white/80 transition-colors duration-200 space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-base font-black text-[#1351AA]">
                        {topicNum}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors">
                        {t.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleJump(startTime)}
                      className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-3 py-1 transition-colors cursor-pointer"
                      title="Jump to topic in media player"
                    >
                      <Play className="w-2.5 h-2.5 mr-1.5 text-[#1351AA]" />
                      {formatTimecode(startTime)}
                    </button>
                  </div>

                  <p className="text-base text-[#444343] leading-relaxed font-sans pl-1">
                    {t.summary || t.description}
                  </p>

                  {t.keyTakeaway && (
                    <div className="p-4 bg-[#1351AA]/5 border-l-4 border-l-[#1351AA] text-xs font-mono text-[#141414]">
                      <span className="font-bold text-[#1351AA] uppercase">CORE TAKEAWAY: </span>
                      {t.keyTakeaway}
                    </div>
                  )}

                  {t.endTime !== undefined && (
                    <div className="text-xs font-mono text-[#7A7A7A]">
                      TIMECODE BOUNDS: {formatTimecode(startTime)} – {formatTimecode(t.endTime)}
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

export default TopicsTab;
