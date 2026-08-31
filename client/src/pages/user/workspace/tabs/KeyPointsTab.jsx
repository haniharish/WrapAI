import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckCircle, Play, User } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="Extracting key points..." />;

  if (!points || points.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-white border border-brand-charcoal/10 text-brand-charcoal">
        <p className="text-sm">No key points extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {points.map((kp, idx) => {
        const text = kp.text || kp.statement;
        const speaker = kp.speakerName || kp.speaker || 'Speaker';
        const timestamp = kp.timestamp !== undefined ? kp.timestamp : (kp.startTime || 0);

        return (
          <Card key={kp.id || idx} hover className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-navy">{text}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-brand-taupe font-medium flex items-center">
                    <User className="w-3 h-3 mr-1 inline" /> {speaker}
                  </span>
                  {kp.category && (
                    <span className="text-[11px] font-mono text-brand-charcoal/60 bg-brand-charcoal/5 px-2 py-0.5">
                      {kp.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-center">
              <Badge variant={kp.importance === 'HIGH' ? 'cyan' : 'default'}>
                {kp.importance || 'MEDIUM'}
              </Badge>
              <button
                onClick={() => dispatch(seekPlayback(timestamp))}
                className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1 transition-colors"
                title="Jump to this key point in audio/video"
              >
                <Play className="w-3 h-3 mr-1" />
                {formatTimecode(timestamp)}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
