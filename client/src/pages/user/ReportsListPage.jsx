import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import { Download, Eye, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('ALL');

  useEffect(() => {
    loadReports();
  }, [selectedFormat]);

  async function loadReports() {
    setIsLoading(true);
    try {
      const query = {};
      if (selectedFormat !== 'ALL') query.format = selectedFormat;
      const res = await reportService.getReports(query);
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownload = async (report) => {
    try {
      const ext = report.format === 'MARKDOWN' ? 'md' : report.format.toLowerCase();
      const filename = `wrapai-${(report.title || 'report').toLowerCase().replace(/\s+/g, '-')}-v${report.version}.${ext}`;
      await reportService.downloadReport(report.id, filename);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report document? Source recording will remain safe.')) {
      return;
    }
    try {
      await reportService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      alert(`Failed to delete report: ${err.message}`);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
              EXPORTED INTELLIGENCE
            </span>
            <h1 className="text-poster-section text-[#141414]">
              GENERATED <br />
              <span className="text-[#1351AA]">REPORTS.</span>
            </h1>
            <p className="text-xs font-mono text-[#7A7A7A] uppercase">
              EXECUTIVE SUMMARIES, MINUTES & BRIEFINGS COMPILED ACROSS WORKSPACES
            </p>
          </div>

          {/* Format Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-white/70 border border-[#C7C7C7]">
            {['ALL', 'PDF', 'DOCX', 'MARKDOWN', 'TXT'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-[#141414] text-[#E3E2DE]'
                    : 'bg-transparent text-[#141414] hover:bg-white/80'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Numbered Reports List */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="REPORTS LIST" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            PAGINATED REGISTRY ({reports.length} READY)
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          {isLoading ? (
            <LoadingState message="LOADING COMPILED REPORTS..." />
          ) : reports.length === 0 ? (
            <EmptyState
              title="NO COMPILED REPORTS"
              description="Open any processed content item in your workspace and click 'Generate Report' to create PDF, Word, or Markdown summaries."
            />
          ) : (
            <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
              {reports.map((rep, idx) => (
                <div
                  key={rep.id}
                  className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/60 px-4 transition-colors duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <span className="font-mono text-sm font-bold text-[#7A7A7A] group-hover:text-[#1351AA]">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1.5">
                      <Link to={`/content/${rep.contentId}/report`}>
                        <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors">
                          {rep.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#7A7A7A]">
                        <span className="font-bold text-[#1351AA]">{rep.format} (V{rep.version})</span>
                        <span>•</span>
                        <span>SOURCE: {rep.contentTitle || 'RECORDING'}</span>
                        <span>•</span>
                        <span>{formatDate(rep.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    <Link to={`/content/${rep.contentId}/report`}>
                      <PosterButton variant="outline" size="sm" icon={Eye}>
                        VIEW
                      </PosterButton>
                    </Link>
                    <PosterButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(rep)}
                      icon={Download}
                    >
                      DOWNLOAD
                    </PosterButton>
                    <button
                      onClick={() => handleDelete(rep.id)}
                      className="p-2 border border-[#C7C7C7] hover:border-[#9e1c1c] hover:text-[#9e1c1c] text-[#7A7A7A] transition-colors cursor-pointer"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsListPage;
