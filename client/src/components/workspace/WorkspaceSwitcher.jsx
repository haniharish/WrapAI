import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/workspaceService.js';
import { Users, ChevronDown, Plus, Check } from 'lucide-react';
import { PosterButton } from '../ui/PosterButton.jsx';
import { Input } from '../ui/Input.jsx';

export function WorkspaceSwitcher({ onWorkspaceChange }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      const res = await workspaceService.getWorkspaces();
      const list = res.data || [];
      setWorkspaces(list);

      const savedId = localStorage.getItem('wrapai_active_workspace');
      const found = list.find((w) => w.id === savedId) || list[0];
      if (found) {
        setActiveWorkspace(found);
        if (onWorkspaceChange) onWorkspaceChange(found);
      }
    } catch (err) {
      console.warn('Could not load workspaces:', err.message);
    }
  }

  const handleSelectWorkspace = (ws) => {
    setActiveWorkspace(ws);
    localStorage.setItem('wrapai_active_workspace', ws.id);
    setIsOpen(false);
    if (onWorkspaceChange) onWorkspaceChange(ws);
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await workspaceService.createWorkspace({ name: newWsName.trim(), type: 'TEAM' });
      const created = res.data;
      setWorkspaces((prev) => [...prev, created]);
      handleSelectWorkspace(created);
      setShowCreateModal(false);
      setNewWsName('');
    } catch (err) {
      alert(`Failed to create team workspace: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 text-xs font-bold uppercase tracking-wider bg-white/60 hover:bg-white border border-[#C7C7C7] transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-2 truncate">
          <Users className="w-3.5 h-3.5 text-[#1351AA] shrink-0" />
          <span className="truncate text-[#141414]">{activeWorkspace?.name || 'WORKSPACE'}</span>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[9px] font-mono bg-[#141414] text-[#E3E2DE] px-1.5 py-0.2">
            {activeWorkspace?.userRole || 'OWNER'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#7A7A7A]" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#141414] z-50 py-1 divide-y divide-[#C7C7C7] text-xs shadow-none">
          <div className="py-1">
            <span className="px-3 py-1 block text-[10px] font-mono text-[#7A7A7A] uppercase font-bold">
              WORKSPACES
            </span>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#E3E2DE] transition-colors cursor-pointer ${
                  activeWorkspace?.id === ws.id ? 'bg-[#1351AA]/10 font-bold text-[#141414]' : 'text-[#444343]'
                }`}
              >
                <div className="truncate">
                  <div className="truncate text-xs uppercase font-bold">{ws.name}</div>
                  <span className="text-[10px] font-mono text-[#7A7A7A] block uppercase">{ws.type} • {ws.userRole}</span>
                </div>
                {activeWorkspace?.id === ws.id && <Check className="w-3.5 h-3.5 text-[#1351AA] shrink-0" />}
              </button>
            ))}
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center justify-center space-x-1 py-2 border border-dashed border-[#141414] text-[#141414] hover:bg-[#E3E2DE] transition-colors font-mono text-xs uppercase font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW TEAM WORKSPACE</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Team Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-8 bg-white border border-[#141414] space-y-6">
            <div className="flex items-center justify-between border-b border-[#C7C7C7] pb-4">
              <h3 className="font-bold uppercase tracking-tight text-lg text-[#141414] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#1351AA]" />
                <span>CREATE WORKSPACE</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#7A7A7A] hover:text-[#141414] text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-5">
              <Input
                label="WORKSPACE NAME"
                required
                placeholder="e.g. Engineering Intelligence"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
              />

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#C7C7C7]">
                <PosterButton variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  CANCEL
                </PosterButton>
                <PosterButton variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'CREATING...' : 'CREATE'}
                </PosterButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSwitcher;
