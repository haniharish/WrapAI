import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Play, Sparkles } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="Identifying thematic topics..." />;

  const handleJump = (seconds) => {
    dispatch(seekPlayback(seconds));
  };

  if (!topics || topics.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-white border border-brand-charcoal/10 text-brand-charcoal">
        <p className="text-sm">No topics detected for this content yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((t, idx) => {
          const startTime = t.startTime !== undefined ? t.startTime : (t.timestamp || 0);
          const topicNum = t.sequence !== undefined ? String(t.sequence).padStart(2, '0') : (t.number || `0${idx + 1}`);

          return (
            <Card key={t.id || idx} hover className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-2xl text-brand-sage">{topicNum}</span>
                  <button
                    onClick={() => handleJump(startTime)}
                    className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1 transition-colors"
                    title="Jump to this topic in audio/video"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {formatTimecode(startTime)}
                  </button>
                </div>

                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy mb-2">
                  {t.title}
                </h3>
                <p className="text-xs text-brand-charcoal leading-relaxed mb-4">
                  {t.summary || t.description}
                </p>

                {t.keyTakeaway && (
                  <div className="p-2.5 bg-brand-sage/15 border-l-2 border-brand-navy text-[11px] text-brand-charcoal mb-3">
                    <span className="font-bold text-brand-navy">Takeaway: </span>
                    {t.keyTakeaway}
                  </div>
                )}
              </div>

              {t.endTime !== undefined && (
                <div className="pt-3 border-t border-brand-charcoal/10 flex items-center justify-between text-xs font-mono text-brand-taupe">
                  <span>Duration: {formatTimecode(startTime)} – {formatTimecode(t.endTime)}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
