import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { FileText, Download, Eye, Trash2, Share2, Sparkles, Filter } from 'lucide-react';
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-charcoal/15">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">EXPORTED INTELLIGENCE</span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
            Generated Reports
          </h1>
          <p className="text-xs text-brand-taupe mt-1">
            Formal executive minutes, lecture summaries, and interview briefs compiled from your content.
          </p>
        </div>

        {/* Format Filter Bar */}
        <div className="flex items-center space-x-1.5 p-1 bg-brand-light border border-brand-charcoal/15 text-xs">
          <Filter className="w-3.5 h-3.5 text-brand-taupe ml-2" />
          {['ALL', 'PDF', 'DOCX', 'MARKDOWN', 'TXT'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1 font-mono text-[11px] transition-all uppercase ${
                selectedFormat === fmt
                  ? 'bg-brand-navy text-brand-white'
                  : 'bg-transparent text-brand-charcoal hover:bg-brand-white'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading compiled reports..." />
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center bg-brand-light/40 border-brand-charcoal/15">
          <FileText className="w-10 h-10 text-brand-taupe mx-auto mb-3" />
          <h3 className="font-display text-xl uppercase text-brand-navy">No Reports Generated Yet</h3>
          <p className="text-xs text-brand-taupe mt-1 max-w-md mx-auto">
            Open any processed content item in your workspace and click "Generate Report" to create PDF, Word, or Markdown summaries.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((rep) => (
            <Card key={rep.id} hover className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={rep.format === 'PDF' ? 'navy' : 'cyan'}>
                    {rep.format} • v{rep.version}
                  </Badge>
                  <span className="text-[11px] font-mono text-brand-taupe">{formatDate(rep.createdAt)}</span>
                </div>

                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy mb-1.5">
                  {rep.title}
                </h3>
                <p className="text-xs text-brand-taupe line-clamp-1 mb-4">
                  Source: {rep.contentTitle || 'Recording'}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {rep.sections?.slice(0, 4).map((sec, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-brand-sage/20 text-brand-charcoal px-2 py-0.5 border border-brand-sage/40">
                      {sec}
                    </span>
                  ))}
                  {rep.sections?.length > 4 && (
                    <span className="text-[10px] font-mono text-brand-taupe px-1 py-0.5">
                      +{rep.sections.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-charcoal/10 flex items-center justify-between gap-2">
                <Link to={`/content/${rep.contentId}/report`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" icon={Eye}>
                    View
                  </Button>
                </Link>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(rep)}
                  icon={Download}
                >
                  {rep.format}
                </Button>

                <button
                  onClick={() => handleDelete(rep.id)}
                  className="p-2 text-brand-taupe hover:text-rose-600 transition-colors"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
