import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportService } from '../../services/reportService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { ShieldCheck, AlertCircle, Check, Users } from 'lucide-react';
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

  if (isLoading) return <LoadingState message="LOADING SHARED REPORT..." />;

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center space-y-6">
        <AlertCircle className="w-12 h-12 text-[#9e1c1c] mx-auto" />
        <h2 className="text-3xl font-black uppercase tracking-tight text-[#141414]">REPORT LINK UNAVAILABLE</h2>
        <p className="text-sm text-[#444343]">{error}</p>
        <Link to="/">
          <PosterButton variant="primary" size="md">GO TO WRAPAI HOME</PosterButton>
        </Link>
      </div>
    );
  }

  const structured = report.structuredData;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      {/* Public Read-Only Banner */}
      <div className="flex items-center justify-between p-4 bg-[#141414] text-[#E3E2DE] text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#1351AA]" />
          <span>VERIFIED READ-ONLY WRAPAI INTELLIGENCE REPORT</span>
        </div>
        <Link to="/register" className="text-[#1351AA] hover:underline font-bold uppercase">
          TRY WRAPAI FREE →
        </Link>
      </div>

      {/* Report Canvas */}
      <div className="bg-white border border-[#C7C7C7] p-8 sm:p-14 font-sans text-[#141414] space-y-10">
        <div className="border-b-2 border-[#141414] pb-8 space-y-4">
          <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">
            WRAPAI INTELLIGENCE SUITE • {report.template} REPORT
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414]">
            {report.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#C7C7C7] text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">SOURCE</span>
              <span className="font-bold text-[#141414]">{report.contentTitle || 'RECORDING'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">DATE</span>
              <span className="text-[#141414]">{formatDate(report.generatedAt)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">FORMAT</span>
              <span className="text-[#141414]">{report.format} (v{report.version})</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">DETAIL</span>
              <span className="text-[#141414]">{report.detailLevel}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {(structured?.sections || []).map((sec) => (
          <div key={sec.id} className="space-y-4">
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#141414] border-b border-[#C7C7C7] pb-2">
              {sec.title}
            </h3>

            {sec.type === 'paragraph' && (
              <p className="text-sm text-[#444343] leading-relaxed whitespace-pre-line bg-[#E3E2DE]/30 p-5 border border-[#C7C7C7]">
                {sec.content}
              </p>
            )}

            {sec.type === 'topics' && (
              <div className="space-y-3">
                {sec.items?.map((t, idx) => (
                  <div key={idx} className="text-sm p-4 bg-[#E3E2DE]/30 border border-[#C7C7C7] space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#141414]">
                      <span>0{idx + 1}. {t.title}</span>
                      {t.timecode && <span className="font-mono text-xs text-[#1351AA]">[{t.timecode}]</span>}
                    </div>
                    {t.summary && <p className="text-xs text-[#444343] leading-relaxed">{t.summary}</p>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'decisions' && (
              <ul className="space-y-3 text-sm">
                {sec.items?.map((d, idx) => (
                  <li key={idx} className="p-4 bg-[#1b6b36]/5 border border-[#1b6b36] text-[#141414] flex items-start space-x-3">
                    <Check className="w-4 h-4 text-[#1b6b36] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold uppercase text-[#141414]">{d.title}</strong>
                      {d.timecode && <span className="font-mono text-xs text-[#7A7A7A] ml-2">({d.timecode})</span>}
                      {d.description && d.description !== d.title && (
                        <p className="text-xs text-[#444343] mt-1">{d.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {sec.type === 'action_items' && (
              <table className="w-full text-xs text-left border border-[#C7C7C7]">
                <thead className="bg-[#E3E2DE] border-b border-[#C7C7C7] uppercase font-mono text-[10px] text-[#141414]">
                  <tr>
                    <th className="p-3">TASK</th>
                    <th className="p-3">OWNER</th>
                    <th className="p-3">DEADLINE</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C7C7C7]">
                  {sec.items?.map((a, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-[#141414]">{a.task}</td>
                      <td className="p-3 font-mono text-[#444343]">{a.owner}</td>
                      <td className="p-3 font-mono text-[#444343]">{a.deadline}</td>
                      <td className="p-3 font-mono text-[#7A7A7A] uppercase">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {sec.type === 'key_points' && (
              <ul className="space-y-2 text-xs text-[#444343]">
                {sec.items?.map((kp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="font-mono text-[#1351AA] font-bold">•</span>
                    <span>{kp.text} {kp.timecode && <span className="font-mono text-[10px] text-[#7A7A7A]">({kp.timecode})</span>}</span>
                  </li>
                ))}
              </ul>
            )}

            {sec.type === 'highlights' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sec.items?.map((hl, idx) => (
                  <div key={idx} className="p-3 bg-[#1351AA]/5 border border-[#1351AA] text-xs space-y-1">
                    <span className="font-bold text-[#1351AA] uppercase">★ {hl.title}</span>
                    {hl.timecode && <span className="font-mono text-[10px] text-[#7A7A7A] ml-2">[{hl.timecode}]</span>}
                    {hl.description && <p className="text-[#444343]">{hl.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {sec.type === 'participants' && (
              <div className="flex flex-wrap gap-2">
                {sec.items?.map((spk, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-[#E3E2DE] border border-[#C7C7C7] text-xs font-mono text-[#141414] flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-[#7A7A7A]" />
                    <strong className="uppercase">{spk.name}</strong>
                    <span className="text-[#7A7A7A]">({spk.speakingTimeFormatted})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="border-t border-[#C7C7C7] pt-8 text-center text-xs font-mono text-[#7A7A7A] flex items-center justify-between">
          <span>WRAPAI INTELLIGENCE PLATFORM</span>
          <span>FROM CONTENT TO CLARITY</span>
          <span>PUBLIC VIEW</span>
        </div>
      </div>
    </div>
  );
}

export default SharedReportPage;
