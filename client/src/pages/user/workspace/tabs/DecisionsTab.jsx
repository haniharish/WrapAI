import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckCircle2, Play, Users } from 'lucide-react';

export function DecisionsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [decisions, setDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setDecisions(res.data?.decisions || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting decisions registry..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {decisions.map((dec) => (
        <Card key={dec.id} hover className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
                  {dec.decision}
                </h3>
              </div>
            </div>
            <button
              onClick={() => dispatch(seekPlayback(dec.timestamp))}
              className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {dec.timecode}
            </button>
          </div>

          <p className="text-xs text-brand-charcoal pl-8 mb-4">{dec.context}</p>

          <div className="pl-8 pt-3 border-t border-brand-charcoal/10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-brand-taupe uppercase font-bold">AGREED BY:</span>
            {dec.participants?.map((p, idx) => (
              <Badge key={idx} variant="default" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
