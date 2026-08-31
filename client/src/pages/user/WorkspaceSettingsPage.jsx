import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/workspaceService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Users, UserPlus, Shield, Trash2, Copy, Check, Activity, Settings as SettingsIcon } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MEMBERS'); // 'MEMBERS' | 'INVITE' | 'AUDIT'

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

        // Load audit logs if owner/admin
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

  if (isLoading) return <LoadingState message="Loading workspace settings & team access..." />;

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(workspace?.userRole);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-charcoal/15">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">
            TEAM & ACCESS CONTROL
          </span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
            {workspace?.name || 'Workspace Settings'}
          </h1>
          <p className="text-xs text-brand-taupe mt-1">
            Manage team members, roles, invitations, and workspace security policies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={workspace?.type === 'TEAM' ? 'navy' : 'sage'}>
            {workspace?.type || 'PERSONAL'} SPACE
          </Badge>
          <Badge variant="cyan">{workspace?.plan || 'FREE'} PLAN</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-brand-charcoal/15 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`px-4 py-2 border-b-2 transition-all ${
            activeTab === 'MEMBERS'
              ? 'border-brand-navy text-brand-navy font-bold'
              : 'border-transparent text-brand-taupe hover:text-brand-navy'
          }`}
        >
          Members ({workspace?.members?.length || 1})
        </button>
        {isOwnerOrAdmin && (
          <>
            <button
              onClick={() => setActiveTab('INVITE')}
              className={`px-4 py-2 border-b-2 transition-all ${
                activeTab === 'INVITE'
                  ? 'border-brand-navy text-brand-navy font-bold'
                  : 'border-transparent text-brand-taupe hover:text-brand-navy'
              }`}
            >
              Invite Teammates
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2 border-b-2 transition-all ${
                activeTab === 'AUDIT'
                  ? 'border-brand-navy text-brand-navy font-bold'
                  : 'border-transparent text-brand-taupe hover:text-brand-navy'
              }`}
            >
              Audit Activity
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Members List */}
      {activeTab === 'MEMBERS' && (
        <Card className="p-6 divide-y divide-brand-charcoal/10 bg-brand-white border-brand-charcoal/20">
          <div className="pb-4 flex items-center justify-between">
            <span className="font-display uppercase text-lg text-brand-navy">Team Roster</span>
            <span className="text-xs font-mono text-brand-taupe">{workspace?.members?.length} active members</span>
          </div>

          <div className="divide-y divide-brand-charcoal/5 pt-2">
            {(workspace?.members || []).map((m) => {
              const u = m.userId || {};
              const isOwner = m.role === 'OWNER';

              return (
                <div key={m.id || m._id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={u.fullName}
                      className="w-8 h-8 rounded-none border border-brand-navy object-cover"
                    />
                    <div>
                      <div className="font-bold text-brand-navy">{u.fullName || 'User'}</div>
                      <div className="font-mono text-[10px] text-brand-taupe">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isOwnerOrAdmin && !isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                        className="p-1 border border-brand-charcoal/20 bg-brand-light text-[11px] font-mono"
                      >
                        <option value="VIEWER">VIEWER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <Badge variant={isOwner ? 'navy' : 'cyan'}>{m.role}</Badge>
                    )}

                    {isOwnerOrAdmin && !isOwner && (
                      <button
                        onClick={() => handleRemoveMember(u.id || u._id)}
                        className="text-brand-taupe hover:text-rose-600 p-1"
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
        </Card>
      )}

      {/* Tab 2: Invite Teammates */}
      {activeTab === 'INVITE' && (
        <Card className="p-6 bg-brand-white border-brand-charcoal/20 space-y-6">
          <div className="border-b border-brand-charcoal/15 pb-3">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
              Invite New Team Member
            </h3>
            <p className="text-xs text-brand-taupe">
              Generate a cryptographic single-use invitation link with specific role permissions.
            </p>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full p-2 text-xs border border-brand-charcoal/20 bg-brand-light focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-1">
                Assign Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full p-2 text-xs border border-brand-charcoal/20 bg-brand-light focus:outline-none font-mono"
              >
                <option value="VIEWER">VIEWER — Can view content, transcripts & reports</option>
                <option value="EDITOR">EDITOR — Can upload content, edit & compile reports</option>
                <option value="ADMIN">ADMIN — Can manage team members & workspace settings</option>
              </select>
            </div>

            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} icon={UserPlus}>
              {isSubmitting ? 'Generating Invitation...' : 'Create Secure Invite Link'}
            </Button>
          </form>

          {/* Generated Link Box */}
          {generatedInvite && (
            <div className="p-4 bg-brand-light border border-brand-charcoal/20 space-y-2">
              <span className="font-mono text-[10px] text-brand-taupe uppercase font-bold block">
                Single-Use Invitation Link (Expires {new Date(generatedInvite.expiresAt).toLocaleDateString()})
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInvite.inviteUrl}
                  className="flex-1 p-2 text-xs font-mono bg-brand-white border border-brand-charcoal/20 select-all"
                />
                <Button variant="primary" size="sm" onClick={handleCopyLink} icon={isCopied ? Check : Copy}>
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Audit Activity */}
      {activeTab === 'AUDIT' && (
        <Card className="p-6 bg-brand-white border-brand-charcoal/20 space-y-4">
          <div className="border-b border-brand-charcoal/15 pb-3">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
              Workspace Audit Trail
            </h3>
            <p className="text-xs text-brand-taupe">
              Immutable log of team membership changes, content creations, and security actions.
            </p>
          </div>

          <div className="divide-y divide-brand-charcoal/10 text-xs">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-brand-taupe font-mono">
                No recorded workspace events yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id || log._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-brand-navy">{log.action?.replace(/_/g, ' ')}</div>
                    <div className="font-mono text-[10px] text-brand-taupe">
                      By {log.userId?.fullName || 'System'} • {log.resourceType}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-brand-taupe">{formatDate(log.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
