import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback, setActiveTab } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Hash, Play } from 'lucide-react';
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
        setTopics(res.data?.topics || []);
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((t) => (
          <Card key={t.id} hover className="flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-2xl text-brand-sage">{t.number}</span>
                <button
                  onClick={() => handleJump(t.timestamp)}
                  className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {formatTimecode(t.timestamp)}
                </button>
              </div>

              <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy mb-2">
                {t.title}
              </h3>
              <p className="text-xs text-brand-charcoal leading-relaxed mb-4">
                {t.description}
              </p>
            </div>

            <div className="pt-3 border-t border-brand-charcoal/10 flex items-center justify-between text-xs font-mono text-brand-taupe">
              <span>{t.segmentCount} transcript segments</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
