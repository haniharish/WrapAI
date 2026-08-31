import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Sparkles, Play } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="Extracting important moments..." />;

  if (!highlights || highlights.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-white border border-brand-charcoal/10 text-brand-charcoal">
        <p className="text-sm">No highlights generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {highlights.map((hl, idx) => {
        const timestamp = hl.timestamp !== undefined ? hl.timestamp : (hl.startTime || 0);

        return (
          <Card key={hl.id || idx} hover className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
                  {hl.title}
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                {hl.importance && (
                  <Badge variant={hl.importance === 'HIGH' ? 'cyan' : 'default'}>
                    {hl.importance}
                  </Badge>
                )}
                <button
                  onClick={() => dispatch(seekPlayback(timestamp))}
                  className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1 transition-colors"
                  title="Jump to this highlight in audio/video"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {formatTimecode(timestamp)}
                </button>
              </div>
            </div>
            <p className="text-xs text-brand-charcoal leading-relaxed pl-6">{hl.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
