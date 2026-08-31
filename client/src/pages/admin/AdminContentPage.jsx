import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Input } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Search, Database, FileText } from 'lucide-react';
import { formatDate, formatBytes, formatTimecode } from '../../utils/formatters.js';

export function AdminContentPage() {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getContentMonitoring();
        setContentList(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <LoadingState message="Loading ingested content registry..." />;

  const filtered = contentList.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-charcoal">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">INGESTION REGISTRY</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
          Content Monitoring
        </h1>
      </div>

      <div className="bg-brand-navy border border-brand-charcoal p-4 max-w-md">
        <Input
          icon={Search}
          placeholder="Search all content titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-brand-charcoal text-white border-brand-charcoal"
        />
      </div>

      <div className="bg-brand-navy border border-brand-charcoal overflow-x-auto">
        <table className="w-full text-left text-xs text-brand-light font-sans">
          <thead className="bg-black/30 border-b border-brand-charcoal uppercase font-mono text-[10px] text-brand-sage">
            <tr>
              <th className="p-4">Content Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Size</th>
              <th className="p-4">Processing Status</th>
              <th className="p-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-charcoal">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-brand-charcoal/40 transition-colors">
                <td className="p-4 font-bold text-white max-w-xs truncate">{c.title}</td>
                <td className="p-4">
                  <Badge variant={c.contentType === 'VIDEO' ? 'blue' : 'sage'}>{c.contentType}</Badge>
                </td>
                <td className="p-4 font-mono text-brand-sage">
                  {c.mediaDurationSeconds ? formatTimecode(c.mediaDurationSeconds) : 'Document'}
                </td>
                <td className="p-4 font-mono">{formatBytes(c.fileSizeBytes)}</td>
                <td className="p-4">
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    {c.processingStatus}
                  </span>
                </td>
                <td className="p-4 font-mono text-brand-sage">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
