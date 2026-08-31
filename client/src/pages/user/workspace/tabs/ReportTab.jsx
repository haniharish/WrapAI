import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { reportService } from '../../../../services/reportService.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Download, RefreshCw, FileCheck, Share2 } from 'lucide-react';
import { formatDate } from '../../../../utils/formatters.js';

export function ReportTab() {
  const { id } = useParams();
  const { content } = useOutletContext();
  const [intel, setIntel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setIntel(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleExport = (format) => {
    alert(`Exporting ${format} report for ${content?.title}`);
  };

  if (isLoading) return <LoadingState message="Compiling executive report..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-white border border-brand-charcoal/15">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-emerald-700" />
          <span className="font-display text-lg uppercase text-brand-navy">Formal Minutes Compiled</span>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} icon={Download}>
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('DOCX')} icon={Download}>
            Download DOCX
          </Button>
          <Button variant="secondary" size="sm" icon={RefreshCw}>
            Regenerate
          </Button>
        </div>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-brand-white border border-brand-charcoal/20 p-8 sm:p-12 shadow-md font-sans text-brand-navy space-y-8">
        <div className="border-b border-brand-charcoal/20 pb-6 text-center">
          <span className="font-display text-4xl uppercase tracking-wider">{content?.title}</span>
          <p className="text-xs font-mono text-brand-taupe mt-2">
            DOCUMENT GENERATED: {formatDate(content?.createdAt)} | WRAPAI INTELLIGENCE SUITE
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase tracking-wide border-b border-brand-charcoal/15 pb-2 mb-3">
            1. Executive Summary
          </h3>
          <p className="text-xs text-brand-charcoal leading-relaxed">{intel?.summary?.executive}</p>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase tracking-wide border-b border-brand-charcoal/15 pb-2 mb-3">
            2. Major Decisions Made
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-xs text-brand-charcoal">
            {intel?.decisions?.map((d) => (
              <li key={d.id}>
                <strong>{d.decision}</strong> ({d.timecode})
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase tracking-wide border-b border-brand-charcoal/15 pb-2 mb-3">
            3. Action Item Registry
          </h3>
          <table className="w-full text-xs text-left border border-brand-charcoal/20 mt-2">
            <thead className="bg-brand-light border-b border-brand-charcoal/20 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-2.5">Task</th>
                <th className="p-2.5">Owner</th>
                <th className="p-2.5">Deadline</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-charcoal/10">
              {intel?.actionItems?.map((a) => (
                <tr key={a.id}>
                  <td className="p-2.5 font-bold">{a.task}</td>
                  <td className="p-2.5 font-mono">{a.owner}</td>
                  <td className="p-2.5 font-mono">{a.deadline}</td>
                  <td className="p-2.5 font-mono">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
