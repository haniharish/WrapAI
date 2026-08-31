import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/workspaceService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import { Trash2, Copy, Check } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MEMBERS');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWsId = localStorage.getItem('wrapai_active_workspace');

  useEffect(() => {
    loadWorkspaceDetails();
  }, [activeWsId]);

  async function loadWorkspaceDetails() {
    setIsLoading(true);
    try {
      const wsListRes = await workspaceService.getWorkspaces();
      const list = wsListRes.data || [];
      const target = list.find((w) => w.id === activeWsId) || list[0];

      if (target) {
        const detailRes = await workspaceService.getWorkspaceById(target.id);
        setWorkspace(detailRes.data);

        if (['OWNER', 'ADMIN'].includes(detailRes.data.userRole)) {
          const logsRes = await workspaceService.getAuditLogs(target.id);
          setAuditLogs(logsRes.data || []);
        }
      }
    } catch (err) {
      console.warn('Workspace loading note:', err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !workspace) return;
    setIsSubmitting(true);
    try {
      const res = await workspaceService.inviteMember(workspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setGeneratedInvite(res.data);
      setInviteEmail('');
    } catch (err) {
      alert(`Invite failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await workspaceService.updateMemberRole(workspace.id, memberId, newRole);
      loadWorkspaceDetails();
    } catch (err) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      await workspaceService.removeMember(workspace.id, memberId);
      loadWorkspaceDetails();
    } catch (err) {
      alert(`Failed to remove member: ${err.message}`);
    }
  };

  const handleCopyLink = () => {
    if (generatedInvite?.inviteUrl) {
      navigator.clipboard.writeText(generatedInvite.inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) return <LoadingState message="LOADING WORKSPACE ROSTER & POLICIES..." />;

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(workspace?.userRole);

  const tabs = [
    { id: 'MEMBERS', label: `MEMBERS (${workspace?.members?.length || 1})` },
    ...(isOwnerOrAdmin
      ? [
          { id: 'INVITE', label: 'INVITE TEAMMATES' },
          { id: 'AUDIT', label: 'AUDIT TRAIL' }
        ]
      : [])
  ];

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
              COLLABORATION & ACCESS CONTROL
            </span>
            <h1 className="text-poster-section text-[#141414]">
              WORKSPACE <br />
              <span className="text-[#1351AA]">SETTINGS.</span>
            </h1>
            <p className="text-xs font-mono text-[#7A7A7A] uppercase">
              {workspace?.name || 'WORKSPACE'} • {workspace?.type || 'PERSONAL'} SPACE
            </p>
          </div>
        </div>
      </div>

      {/* 2. Workspace Management Canvas */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="ACCESS MANAGEMENT" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            RBAC ROLE POLICIES
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-8">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          />

          {/* Tab 1: Members List */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#C7C7C7]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7A7A]">
                  ACTIVE COLLABORATORS
                </span>
                <span className="font-mono text-xs font-bold text-[#1351AA]">
                  {workspace?.members?.length} MEMBERS
                </span>
              </div>

              <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
                {(workspace?.members || []).map((m, idx) => {
                  const u = m.userId || {};
                  const isOwner = m.role === 'OWNER';

                  return (
                    <div key={m.id || m._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-sm font-bold text-[#7A7A7A]">
                          0{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold uppercase text-sm text-[#141414]">{u.fullName || 'USER'}</div>
                          <div className="font-mono text-xs text-[#7A7A7A]">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        {isOwnerOrAdmin && !isOwner ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                            className="px-3 py-1.5 border border-[#C7C7C7] bg-[#E3E2DE] text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#1351AA]"
                          >
                            <option value="VIEWER">VIEWER</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1 bg-[#141414] text-[#E3E2DE] text-xs font-mono font-bold uppercase">
                            {m.role}
                          </span>
                        )}

                        {isOwnerOrAdmin && !isOwner && (
                          <button
                            onClick={() => handleRemoveMember(u.id || u._id)}
                            className="p-1.5 border border-[#C7C7C7] text-[#7A7A7A] hover:border-[#9e1c1c] hover:text-[#9e1c1c] transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Invite Teammates */}
          {activeTab === 'INVITE' && (
            <div className="space-y-6 max-w-xl">
              <div className="space-y-1">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414]">
                  INVITE NEW TEAM MEMBER
                </h3>
                <p className="text-xs text-[#444343]">
                  Generate a cryptographic SHA-256 single-use invitation link with specific role permissions.
                </p>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-5">
                <Input
                  label="RECIPIENT EMAIL"
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />

                <Select
                  label="ASSIGN ROLE"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  options={[
                    { value: 'VIEWER', label: 'VIEWER — Can view content, transcripts & reports' },
                    { value: 'EDITOR', label: 'EDITOR — Can upload content, edit & compile reports' },
                    { value: 'ADMIN', label: 'ADMIN — Can manage team members & settings' }
                  ]}
                />

                <PosterButton variant="primary" size="md" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'GENERATING...' : 'CREATE SECURE INVITE LINK'}
                </PosterButton>
              </form>

              {/* Generated Link Box */}
              {generatedInvite && (
                <div className="p-5 bg-[#E3E2DE] border border-[#141414] space-y-3">
                  <span className="font-mono text-[10px] text-[#7A7A7A] uppercase font-bold block">
                    SINGLE-USE INVITATION LINK (EXPIRES {new Date(generatedInvite.expiresAt).toLocaleDateString()})
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInvite.inviteUrl}
                      className="flex-1 p-2.5 text-xs font-mono bg-white border border-[#C7C7C7] select-all"
                    />
                    <PosterButton variant="secondary" size="sm" onClick={handleCopyLink} icon={isCopied ? Check : Copy}>
                      {isCopied ? 'COPIED' : 'COPY'}
                    </PosterButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Audit Activity */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414]">
                  WORKSPACE AUDIT TRAIL
                </h3>
                <p className="text-xs text-[#444343]">
                  Immutable log of team membership changes, content creations, and security actions.
                </p>
              </div>

              <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7] text-xs font-mono">
                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-[#7A7A7A]">
                    NO RECORDED WORKSPACE EVENTS YET.
                  </div>
                ) : (
                  auditLogs.map((log, idx) => (
                    <div key={log.id || log._id} className="py-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#141414] uppercase">{log.action?.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] text-[#7A7A7A]">
                          BY {log.userId?.fullName || 'SYSTEM'} • {log.resourceType}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#7A7A7A]">{formatDate(log.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceSettingsPage;
