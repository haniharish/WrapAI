import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { ListOrdered, Play, CheckCircle } from 'lucide-react';
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
        setPoints(res.data?.keyPoints || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting key points..." />;

  return (
    <div className="space-y-4 max-w-5xl">
      {points.map((kp) => (
        <Card key={kp.id} hover className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-navy">{kp.statement}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-brand-taupe font-medium">Attributed to: {kp.speaker}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <Badge variant={kp.importance === 'HIGH' ? 'cyan' : 'default'}>
              {kp.importance}
            </Badge>
            <button
              onClick={() => dispatch(seekPlayback(kp.timestamp))}
              className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {formatTimecode(kp.timestamp)}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
