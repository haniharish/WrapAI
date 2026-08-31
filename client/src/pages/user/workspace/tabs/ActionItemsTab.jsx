import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckSquare, Square, Play, Calendar, User, CheckCircle2 } from 'lucide-react';
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
        const intel = res.data || res;
        setItems(intel?.actionItems || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleStatus = async (itemId, currentStatus) => {
    const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'Completed';
    const nextStatus = isCompleted ? 'PENDING' : 'COMPLETED';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item, idx) => {
        const targetId = item.id || item._id || idx;
        return (targetId === itemId || idx === itemId) ? { ...item, status: nextStatus } : item;
      })
    );

    try {
      await intelligenceService.updateActionItemStatus(id, itemId, nextStatus);
    } catch (err) {
      console.error('Failed to update action item status:', err);
    }
  };

  if (isLoading) return <LoadingState message="Extracting action items..." />;

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-white border border-brand-charcoal/10 text-brand-charcoal">
        <p className="text-sm">No action items assigned for this content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-brand-white border border-brand-charcoal/15 divide-y divide-brand-charcoal/10">
        {items.map((act, idx) => {
          const itemId = act.id || act._id || idx;
          const owner = act.ownerName || act.owner || 'Unassigned';
          const deadline = act.deadlineRaw || act.deadline || 'Next Sprint';
          const status = (act.status || 'PENDING').toUpperCase();
          const isDone = status === 'COMPLETED';
          const timestamp = act.timestamp || 0;

          return (
            <div
              key={itemId}
              className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                isDone ? 'bg-brand-sage/10' : 'hover:bg-brand-sage/5'
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => toggleStatus(itemId, status)}
                  className="mt-0.5 text-brand-navy hover:text-brand-charcoal focus:outline-none transition-colors"
                  title="Toggle status"
                >
                  {isDone ? (
                    <CheckSquare className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Square className="w-5 h-5 text-brand-charcoal/40 hover:text-brand-navy" />
                  )}
                </button>
                <div>
                  <p className={`text-sm font-bold ${isDone ? 'line-through text-brand-taupe' : 'text-brand-navy'}`}>
                    {act.task}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-brand-taupe">
                    <span className="flex items-center text-brand-charcoal">
                      <User className="w-3.5 h-3.5 mr-1 text-brand-taupe" /> Assigned to: <strong className="ml-1">{owner}</strong>
                    </span>
                    <span className="flex items-center text-brand-charcoal">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-brand-taupe" /> Due: <strong className="ml-1">{deadline}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-center">
                <button
                  onClick={() => toggleStatus(itemId, status)}
                  className="cursor-pointer"
                  title="Click to toggle status"
                >
                  <Badge variant={isDone ? 'success' : status === 'IN_PROGRESS' ? 'cyan' : 'warning'}>
                    {isDone ? 'COMPLETED' : status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'OPEN'}
                  </Badge>
                </button>

                <button
                  onClick={() => dispatch(seekPlayback(timestamp))}
                  className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1 transition-colors"
                  title="Jump to this task in audio/video"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {formatTimecode(timestamp)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
