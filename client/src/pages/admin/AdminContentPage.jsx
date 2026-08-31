import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Input } from '../../components/ui/Input.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Search } from 'lucide-react';
import { formatDate, formatBytes, formatTimecode } from '../../utils/formatters.js';

export function AdminContentPage() {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getContentMonitoring();
        setContentList(res.data || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <LoadingState message="POLLING CONTENT REGISTRY..." />;

  const filtered = contentList.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="border-b border-[#444343] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            INGESTION REGISTRY
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#E3E2DE]">
            CONTENT <br />
            <span className="text-[#1351AA]">MONITORING.</span>
          </h1>
        </div>
      </div>

      {/* 2. Search Filter */}
      <div className="bg-black/40 border border-[#444343] p-4 max-w-md">
        <Input
          icon={Search}
          placeholder="SEARCH CONTENT TITLES..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 3. Content Table */}
      <div className="bg-black/40 border border-[#444343] overflow-x-auto">
        <table className="w-full text-left text-xs text-[#E3E2DE] font-sans">
          <thead className="bg-black/60 border-b border-[#444343] uppercase font-mono text-[10px] text-[#7A7A7A]">
            <tr>
              <th className="p-4">CONTENT TITLE</th>
              <th className="p-4">TYPE</th>
              <th className="p-4">DURATION</th>
              <th className="p-4">SIZE</th>
              <th className="p-4">STATUS</th>
              <th className="p-4">CREATED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#444343]">
            {filtered.map((c, idx) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-[#E3E2DE] max-w-xs truncate uppercase flex items-center space-x-3">
                  <span className="font-mono text-[#7A7A7A]">0{idx + 1}</span>
                  <span className="truncate">{c.title}</span>
                </td>
                <td className="p-4 font-mono font-bold uppercase text-[#1351AA]">
                  {c.contentType}
                </td>
                <td className="p-4 font-mono text-[#7A7A7A]">
                  {c.mediaDurationSeconds ? formatTimecode(c.mediaDurationSeconds) : 'DOCUMENT'}
                </td>
                <td className="p-4 font-mono text-[#E3E2DE]">{formatBytes(c.fileSizeBytes)}</td>
                <td className="p-4">
                  <span className="font-mono text-[10px] text-[#1b6b36] font-bold uppercase">
                    {c.processingStatus}
                  </span>
                </td>
                <td className="p-4 font-mono text-[#7A7A7A]">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminContentPage;
