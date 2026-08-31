import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportService } from '../../services/reportService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { FileCheck, Sparkles, AlertCircle, Check, Users, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function SharedReportPage() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await reportService.getSharedReport(token);
        setReport(res.data);
      } catch (err) {
        setError(err.message || 'Shared report not found or link has expired.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token]);

  if (isLoading) return <LoadingState message="Loading shared intelligence report..." />;

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-display text-2xl uppercase text-brand-navy">Report Link Unavailable</h2>
        <p className="text-xs text-brand-taupe">{error}</p>
        <Link to="/">
          <Button variant="outline" size="sm">Go to WrapAI Home</Button>
        </Link>
      </div>
    );
  }

  const structured = report.structuredData;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Public Read-Only Banner */}
      <div className="flex items-center justify-between p-3 bg-brand-navy text-brand-white text-xs font-mono">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-cyan" />
          <span>VERIFIED READ-ONLY WRAPAI INTELLIGENCE REPORT</span>
        </div>
        <Link to="/register" className="text-brand-cyan hover:underline text-[11px]">
          Try WrapAI Free →
        </Link>
      </div>

      {/* Report Canvas */}
      <div className="bg-brand-white border border-brand-charcoal/20 p-8 sm:p-12 shadow-xl font-sans text-brand-navy space-y-8">
        <div className="border-b-2 border-brand-navy pb-6">
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand-taupe uppercase">
            WRAPAI INTELLIGENCE SUITE • {report.template} REPORT
          </span>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider text-brand-navy mt-1">
            {report.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-3 bg-brand-light border border-brand-charcoal/15 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">SOURCE</span>
              <span className="font-semibold text-brand-charcoal">{report.contentTitle || 'Recording'}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">DATE</span>
              <span className="font-semibold text-brand-charcoal">{formatDate(report.generatedAt)}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">FORMAT</span>
              <span className="font-semibold text-brand-charcoal">{report.format} (v{report.version})</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">DETAIL</span>
              <span className="font-semibold text-brand-charcoal">{report.detailLevel}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {(structured?.sections || []).map((sec) => (
          <div key={sec.id} className="space-y-3">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy border-b border-brand-charcoal/15 pb-1">
              {sec.title}
            </h3>

            {sec.type === 'paragraph' && (
              <p className="text-xs text-brand-charcoal leading-relaxed whitespace-pre-line bg-brand-light/40 p-4 border border-brand-charcoal/10">
                {sec.content}
              </p>
            )}

            {sec.type === 'topics' && (
              <div className="space-y-2">
                {sec.items?.map((t, idx) => (
                  <div key={idx} className="text-xs p-3 bg-brand-light/30 border border-brand-charcoal/10">
                    <div className="flex items-center justify-between font-semibold text-brand-navy">
                      <span>• {t.title}</span>
                      {t.timecode && <span className="font-mono text-[10px] text-brand-taupe">[{t.timecode}]</span>}
                    </div>
                    {t.summary && <p className="text-[11px] text-brand-charcoal mt-1 leading-normal">{t.summary}</p>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'decisions' && (
              <ul className="space-y-2 text-xs">
                {sec.items?.map((d, idx) => (
                  <li key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200 text-brand-charcoal flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-950">{d.title}</strong>
                      {d.timecode && <span className="font-mono text-[10px] text-brand-taupe ml-2">({d.timecode})</span>}
                      {d.description && d.description !== d.title && (
                        <p className="text-[11px] text-emerald-900/80 mt-0.5">{d.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {sec.type === 'action_items' && (
              <table className="w-full text-xs text-left border border-brand-charcoal/20">
                <thead className="bg-brand-light border-b border-brand-charcoal/20 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-2.5">Task</th>
                    <th className="p-2.5">Owner</th>
                    <th className="p-2.5">Deadline</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-charcoal/10">
                  {sec.items?.map((a, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-brand-navy">{a.task}</td>
                      <td className="p-2.5 font-mono text-brand-charcoal">{a.owner}</td>
                      <td className="p-2.5 font-mono text-brand-charcoal">{a.deadline}</td>
                      <td className="p-2.5 font-mono text-brand-taupe">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {sec.type === 'key_points' && (
              <ul className="list-disc pl-5 space-y-1 text-xs text-brand-charcoal">
                {sec.items?.map((kp, idx) => (
                  <li key={idx}>
                    {kp.text} {kp.timecode && <span className="font-mono text-[10px] text-brand-taupe">({kp.timecode})</span>}
                  </li>
                ))}
              </ul>
            )}

            {sec.type === 'highlights' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sec.items?.map((hl, idx) => (
                  <div key={idx} className="p-2.5 bg-cyan-50/50 border border-cyan-200 text-xs">
                    <span className="font-bold text-cyan-950">★ {hl.title}</span>
                    {hl.timecode && <span className="font-mono text-[10px] text-brand-taupe ml-1">[{hl.timecode}]</span>}
                    {hl.description && <p className="text-[11px] text-cyan-900 mt-1">{hl.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'participants' && (
              <div className="flex flex-wrap gap-2">
                {sec.items?.map((spk, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-brand-light border border-brand-charcoal/15 text-xs text-brand-charcoal flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-brand-taupe" />
                    <strong>{spk.name}</strong>
                    <span className="text-brand-taupe font-mono text-[10px]">({spk.speakingTimeFormatted})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="border-t border-brand-charcoal/15 pt-6 text-center text-[10px] font-mono text-brand-taupe flex items-center justify-between">
          <span>WrapAI Intelligence Platform</span>
          <span>From Content to Clarity</span>
          <span>Shared View</span>
        </div>
      </div>
    </div>
  );
}
