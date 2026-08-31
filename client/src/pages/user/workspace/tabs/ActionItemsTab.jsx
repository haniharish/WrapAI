import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckSquare, Play, Calendar, User } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function ActionItemsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setItems(res.data?.actionItems || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleStatus = async (actId, currentStatus) => {
    const nextStatus =
      currentStatus === 'Pending' ? 'In Progress' : currentStatus === 'In Progress' ? 'Completed' : 'Pending';
    const res = await intelligenceService.updateActionItemStatus(id, actId, nextStatus);
    setItems(res.data);
  };

  if (isLoading) return <LoadingState message="Extracting action items..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-brand-white border border-brand-charcoal/15 divide-y divide-brand-charcoal/10">
        {items.map((act) => (
          <div key={act.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <CheckSquare className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-brand-navy">{act.task}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-brand-taupe">
                  <span className="flex items-center text-brand-charcoal">
                    <User className="w-3.5 h-3.5 mr-1 text-brand-taupe" /> {act.owner}
                  </span>
                  <span className="flex items-center text-brand-charcoal">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-brand-taupe" /> Due: {act.deadline}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-center">
              <button
                onClick={() => toggleStatus(act.id, act.status)}
                className="cursor-pointer"
                title="Click to toggle status"
              >
                <Badge
                  variant={
                    act.status === 'Completed'
                      ? 'success'
                      : act.status === 'In Progress'
                      ? 'cyan'
                      : 'warning'
                  }
                >
                  {act.status}
                </Badge>
              </button>

              <button
                onClick={() => dispatch(seekPlayback(act.timestamp))}
                className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
              >
                <Play className="w-3 h-3 mr-1" />
                {act.timecode}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
