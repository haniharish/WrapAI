import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Search } from 'lucide-react';
import { formatDate, formatBytes } from '../../utils/formatters.js';

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers();
      setUsers(res.data || []);
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

  if (isLoading) return <LoadingState message="POLLING USER DIRECTORY..." />;

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="border-b border-[#444343] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            GOVERNANCE & IDENTITIES
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#E3E2DE]">
            USER <br />
            <span className="text-[#1351AA]">DIRECTORY.</span>
          </h1>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-black/40 border border-[#444343] p-4 max-w-md">
        <Input
          icon={Search}
          placeholder="SEARCH BY NAME OR EMAIL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 3. Users Table */}
      <div className="bg-black/40 border border-[#444343] overflow-x-auto">
        <table className="w-full text-left text-xs text-[#E3E2DE] font-sans">
          <thead className="bg-black/60 border-b border-[#444343] uppercase font-mono text-[10px] text-[#7A7A7A]">
            <tr>
              <th className="p-4">USER</th>
              <th className="p-4">ROLE</th>
              <th className="p-4">JOINED</th>
              <th className="p-4">CONTENT COUNT</th>
              <th className="p-4">STORAGE USED</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#444343]">
            {filtered.map((u, idx) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#141414] border border-[#444343] flex items-center justify-center font-mono font-bold text-[#E3E2DE]">
                    0{idx + 1}
                  </div>
                  <div>
                    <p className="text-[#E3E2DE] uppercase font-bold">{u.fullName}</p>
                    <p className="text-[10px] font-mono text-[#7A7A7A]">{u.email}</p>
                  </div>
                </td>
                <td className="p-4 font-mono font-bold uppercase text-[#1351AA]">
                  {u.role}
                </td>
                <td className="p-4 font-mono text-[#7A7A7A]">{formatDate(u.joinedAt)}</td>
                <td className="p-4 font-mono text-[#E3E2DE]">{u.contentCount} ITEMS</td>
                <td className="p-4 font-mono text-[#E3E2DE]">{formatBytes(u.storageUsedBytes)}</td>
                <td className="p-4">
                  <span
                    className={`font-mono text-[10px] uppercase font-bold ${
                      u.status === 'ACTIVE' ? 'text-[#1b6b36]' : 'text-[#9e1c1c]'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <PosterButton
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(u.id)}
                  >
                    {u.status === 'ACTIVE' ? 'DEACTIVATE' : 'ACTIVATE'}
                  </PosterButton>
                  <PosterButton
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleUserRole(u.id)}
                  >
                    TOGGLE ROLE
                  </PosterButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
