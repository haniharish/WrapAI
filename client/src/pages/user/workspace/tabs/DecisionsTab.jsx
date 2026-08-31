import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckCircle2, Play, Users } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="Extracting decisions registry..." />;

  if (!decisions || decisions.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-white border border-brand-charcoal/10 text-brand-charcoal">
        <p className="text-sm">No explicit decisions detected in this transcript.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {decisions.map((dec, idx) => {
        const title = dec.title || dec.decision;
        const description = dec.description || dec.context;
        const agreedBy = dec.agreedByNames || dec.participants || [];
        const timestamp = dec.timestamp || 0;

        return (
          <Card key={dec.id || idx} hover className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
                    {title}
                  </h3>
                  {dec.category && (
                    <span className="text-[10px] font-mono font-bold uppercase text-brand-cyan bg-brand-navy px-2 py-0.5 mt-1 inline-block">
                      {dec.category}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => dispatch(seekPlayback(timestamp))}
                className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1 transition-colors"
                title="Jump to this decision in audio/video"
              >
                <Play className="w-3 h-3 mr-1" />
                {formatTimecode(timestamp)}
              </button>
            </div>

            {description && (
              <p className="text-xs text-brand-charcoal pl-8 mb-4 leading-relaxed">
                {description}
              </p>
            )}

            {agreedBy && agreedBy.length > 0 && (
              <div className="pl-8 pt-3 border-t border-brand-charcoal/10 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-brand-taupe uppercase font-bold flex items-center">
                  <Users className="w-3 h-3 mr-1" /> AGREED BY:
                </span>
                {agreedBy.map((p, pIdx) => (
                  <Badge key={pIdx} variant="default" className="text-[10px]">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
