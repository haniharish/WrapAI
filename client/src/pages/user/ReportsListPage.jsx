import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { FileText, Download, Eye, Sparkles } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await reportService.getReports();
        setReports(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDownload = (format) => {
    alert(`Simulating ${format} report download.`);
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">EXPORTED INTELLIGENCE</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Generated Reports
        </h1>
        <p className="text-xs text-brand-taupe mt-1">
          Formal executive minutes, lecture summaries, and interview briefs compiled from your content.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading compiled reports..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((rep) => (
            <Card key={rep.id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="cyan">{rep.type.replace('_', ' ')}</Badge>
                  <span className="text-[11px] font-mono text-brand-taupe">{formatDate(rep.date)}</span>
                </div>

                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy mb-2">
                  {rep.title}
                </h3>
                <p className="text-xs text-brand-taupe line-clamp-2 mb-4">
                  Source: {rep.contentTitle}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {rep.sections?.map((sec, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-brand-sage/20 text-brand-charcoal px-2 py-0.5 border border-brand-sage/40">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-charcoal/10 flex items-center justify-between gap-2">
                <Link to={`/content/${rep.contentId}/report`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" icon={Eye}>
                    View
                  </Button>
                </Link>

                <Button variant="secondary" size="sm" onClick={() => handleDownload('PDF')} icon={Download}>
                  PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDownload('DOCX')} icon={Download}>
                  DOCX
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
