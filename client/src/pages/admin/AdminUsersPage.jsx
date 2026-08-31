import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Search, UserCheck, Shield, UserX, Trash2 } from 'lucide-react';
import { formatDate, formatBytes } from '../../utils/formatters.js';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers();
      setUsers(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleUserStatus = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const newStatus = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const toggleUserRole = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' } : u))
    );
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingState message="Loading user directory..." />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-charcoal">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">GOVERNANCE</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
          User Management
        </h1>
      </div>

      <div className="bg-brand-navy border border-brand-charcoal p-4 max-w-md">
        <Input
          icon={Search}
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-brand-charcoal text-white border-brand-charcoal"
        />
      </div>

      {/* Users Table */}
      <div className="bg-brand-navy border border-brand-charcoal overflow-x-auto">
        <table className="w-full text-left text-xs text-brand-light font-sans">
          <thead className="bg-black/30 border-b border-brand-charcoal uppercase font-mono text-[10px] text-brand-sage">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Content Count</th>
              <th className="p-4">Storage Used</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-charcoal">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-brand-charcoal/40 transition-colors">
                <td className="p-4 font-bold flex items-center space-x-3">
                  <img src={u.avatar} alt={u.fullName} className="w-7 h-7 object-cover" />
                  <div>
                    <p className="text-white">{u.fullName}</p>
                    <p className="text-[10px] font-mono text-brand-sage">{u.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={u.role === 'ADMIN' ? 'cyan' : 'default'}>{u.role}</Badge>
                </td>
                <td className="p-4 font-mono text-brand-sage">{formatDate(u.joinedAt)}</td>
                <td className="p-4 font-mono">{u.contentCount} items</td>
                <td className="p-4 font-mono">{formatBytes(u.storageUsedBytes)}</td>
                <td className="p-4">
                  <span
                    className={`font-mono text-[10px] uppercase font-bold ${
                      u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-brand-charcoal text-brand-sage hover:text-white"
                    onClick={() => toggleUserStatus(u.id)}
                  >
                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-brand-charcoal text-white"
                    onClick={() => toggleUserRole(u.id)}
                  >
                    Role: {u.role}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
