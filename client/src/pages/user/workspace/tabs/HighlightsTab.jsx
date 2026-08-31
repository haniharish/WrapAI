import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Sparkles, Play } from 'lucide-react';

export function HighlightsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setHighlights(res.data?.highlights || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting important moments..." />;

  return (
    <div className="space-y-4 max-w-5xl">
      {highlights.map((hl) => (
        <Card key={hl.id} hover className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
              {hl.title}
            </h3>
            <button
              onClick={() => dispatch(seekPlayback(hl.timestamp))}
              className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {hl.timecode}
            </button>
          </div>
          <p className="text-xs text-brand-charcoal leading-relaxed">{hl.description}</p>
        </Card>
      ))}
    </div>
  );
}
