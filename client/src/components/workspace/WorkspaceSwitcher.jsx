import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/workspaceService.js';
import { Users, ChevronDown, Plus, Check, Shield } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';

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
        className="w-full flex items-center justify-between p-2 text-xs font-bold uppercase tracking-wider bg-brand-light/60 hover:bg-brand-light border border-brand-charcoal/15 transition-colors"
      >
        <div className="flex items-center space-x-2 truncate">
          <Users className="w-3.5 h-3.5 text-brand-navy flex-shrink-0" />
          <span className="truncate text-brand-navy">{activeWorkspace?.name || 'My Space'}</span>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="text-[9px] font-mono bg-brand-navy/10 text-brand-navy px-1 py-0.2">
            {activeWorkspace?.userRole || 'OWNER'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-brand-taupe" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-brand-white border border-brand-charcoal/20 shadow-xl z-50 py-1 divide-y divide-brand-charcoal/10 text-xs">
          <div className="py-1">
            <span className="px-3 py-1 block text-[10px] font-mono text-brand-taupe uppercase">
              Workspaces
            </span>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-brand-light transition-colors ${
                  activeWorkspace?.id === ws.id ? 'bg-brand-sage/15 font-bold text-brand-navy' : 'text-brand-charcoal'
                }`}
              >
                <div className="truncate">
                  <div className="truncate text-xs">{ws.name}</div>
                  <span className="text-[10px] font-mono text-brand-taupe block uppercase">{ws.type} • {ws.userRole}</span>
                </div>
                {activeWorkspace?.id === ws.id && <Check className="w-3.5 h-3.5 text-brand-navy flex-shrink-0" />}
              </button>
            ))}
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center justify-center space-x-1 py-1.5 border border-dashed border-brand-charcoal/30 text-brand-navy hover:bg-brand-light transition-colors font-mono text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Team Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Team Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 bg-brand-white border border-brand-charcoal/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-charcoal/15 pb-3">
              <h3 className="font-display text-lg uppercase tracking-wide text-brand-navy flex items-center space-x-2">
                <Users className="w-4 h-4 text-brand-navy" />
                <span>Create Team Workspace</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-brand-taupe hover:text-brand-navy text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Intelligence"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full p-2 text-xs border border-brand-charcoal/20 bg-brand-light focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brand-charcoal/15">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
