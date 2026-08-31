import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../../../components/ui/GridSidebarLabel.jsx';
import { CheckSquare, Square, Play, Calendar, User } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="EXTRACTING ACTION ITEMS..." />;

  if (!items || items.length === 0) {
    return (
      <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center text-[#7A7A7A] font-mono text-xs">
        NO ACTION ITEMS ASSIGNED IN THIS RECORDING.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="EXECUTION TASKS" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            {items.length} ASSIGNED ACTIONS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
            {items.map((act, idx) => {
              const itemId = act.id || act._id || idx;
              const owner = act.ownerName || act.owner || 'UNASSIGNED';
              const deadline = act.deadlineRaw || act.deadline || 'NEXT SPRINT';
              const status = (act.status || 'PENDING').toUpperCase();
              const isDone = status === 'COMPLETED';
              const timestamp = act.timestamp || 0;

              return (
                <div
                  key={itemId}
                  className={`py-6 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 ${
                    isDone ? 'bg-[#1b6b36]/5' : 'bg-white/40 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleStatus(itemId, status)}
                      className="mt-0.5 text-[#141414] hover:text-[#1351AA] transition-colors cursor-pointer"
                      title="Toggle status"
                    >
                      {isDone ? (
                        <CheckSquare className="w-5 h-5 text-[#1b6b36]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#7A7A7A] hover:text-[#141414]" />
                      )}
                    </button>
                    <div className="space-y-1">
                      <p className={`text-base font-bold uppercase tracking-tight ${isDone ? 'line-through text-[#7A7A7A]' : 'text-[#141414]'}`}>
                        {act.task}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7A7A7A]">
                        <span className="flex items-center text-[#141414]">
                          <User className="w-3.5 h-3.5 mr-1 text-[#7A7A7A]" /> OWNER: <strong className="ml-1 uppercase">{owner}</strong>
                        </span>
                        <span className="flex items-center text-[#141414]">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-[#7A7A7A]" /> DUE: <strong className="ml-1 uppercase">{deadline}</strong>
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
                      <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase ${
                        isDone
                          ? 'bg-[#1b6b36] text-[#E3E2DE]'
                          : status === 'IN_PROGRESS'
                          ? 'bg-[#1351AA] text-[#E3E2DE]'
                          : 'bg-[#E3E2DE] text-[#141414] border border-[#C7C7C7]'
                      }`}>
                        {isDone ? 'COMPLETED' : status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'OPEN'}
                      </span>
                    </button>

                    <button
                      onClick={() => dispatch(seekPlayback(timestamp))}
                      className="inline-flex items-center text-xs font-mono font-bold text-[#141414] hover:text-[#1351AA] bg-[#E3E2DE] hover:bg-white border border-[#C7C7C7] px-2.5 py-1 transition-colors cursor-pointer"
                      title="Jump to task in media player"
                    >
                      <Play className="w-2.5 h-2.5 mr-1.5 text-[#1351AA]" />
                      {formatTimecode(timestamp)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionItemsTab;
