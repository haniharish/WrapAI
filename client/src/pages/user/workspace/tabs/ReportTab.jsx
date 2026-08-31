import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { reportService } from '../../../../services/reportService.js';
import { PosterButton } from '../../../../components/ui/PosterButton.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import {
  Download,
  Share2,
  Sliders,
  Sparkles,
  Check,
  Users,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '../../../../utils/formatters.js';

const TEMPLATES = [
  { id: 'MEETING', name: 'MEETING MINUTES', desc: 'Summary, decisions, action items, attendance' },
  { id: 'EXECUTIVE', name: 'EXECUTIVE BRIEF', desc: 'High-level strategic digest & critical outcomes' },
  { id: 'LECTURE', name: 'LECTURE NOTES', desc: 'Study notes, core concepts, review questions' },
  { id: 'INTERVIEW', name: 'INTERVIEW SUMMARY', desc: 'Candidate competencies, responses, highlights' },
  { id: 'GENERAL', name: 'GENERAL REPORT', desc: 'Standard content analysis & takeaways' }
];

const SECTIONS_LIST = [
  { id: 'SUMMARY', label: 'EXECUTIVE SUMMARY' },
  { id: 'TOPICS', label: 'TOPICS DISCUSSED' },
  { id: 'DECISIONS', label: 'AGREED DECISIONS' },
  { id: 'ACTION_ITEMS', label: 'ACTION ITEM REGISTRY' },
  { id: 'KEY_POINTS', label: 'KEY POINTS & TAKEAWAYS' },
  { id: 'QUESTIONS', label: 'QUESTIONS RAISED' },
  { id: 'HIGHLIGHTS', label: 'KEY HIGHLIGHTS' },
  { id: 'PARTICIPANTS', label: 'PARTICIPANTS & SPEAKERS' }
];

export function ReportTab() {
  const { id } = useParams();
  const { content } = useOutletContext();

  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Config state
  const [selectedTemplate, setSelectedTemplate] = useState('MEETING');
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [selectedDetail, setSelectedDetail] = useState('STANDARD');
  const [selectedSections, setSelectedSections] = useState(['SUMMARY', 'TOPICS', 'DECISIONS', 'ACTION_ITEMS', 'HIGHLIGHTS', 'PARTICIPANTS']);
  const [customTitle, setCustomTitle] = useState('');

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadReportsAndPreview();
  }, [id]);

  async function loadReportsAndPreview() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const reportsRes = await reportService.getContentReports(id);
      const fetchedReports = reportsRes.data || [];
      setReports(fetchedReports);

      if (fetchedReports.length > 0) {
        setActiveReport(fetchedReports[0]);
      }

      const previewRes = await reportService.previewReport(id, {
        templateId: selectedTemplate,
        detailLevel: selectedDetail,
        requestedSections: selectedSections,
        customTitle: customTitle || undefined
      });
      setPreviewData(previewRes.data);
    } catch (err) {
      console.warn('Preview compilation note:', err.message);
      setErrorMsg(err.message || 'Failed to compile report preview');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshPreview() {
    try {
      const previewRes = await reportService.previewReport(id, {
        templateId: selectedTemplate,
        detailLevel: selectedDetail,
        requestedSections: selectedSections,
        customTitle: customTitle || undefined
      });
      setPreviewData(previewRes.data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update preview');
    }
  }

  const toggleSection = (secId) => {
    setSelectedSections((prev) =>
      prev.includes(secId) ? prev.filter((s) => s !== secId) : [...prev, secId]
    );
  };

  async function handleGenerateReport(formatOverride = null) {
    const fmt = formatOverride || selectedFormat;
    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStage('BUILDING STRUCTURED REPORT...');

    try {
      setTimeout(() => setGenerationStage('RENDERING DOCUMENT...'), 400);
      setTimeout(() => setGenerationStage('UPLOADING TO S3 STORAGE...'), 800);

      const res = await reportService.generateReport(id, {
        templateId: selectedTemplate,
        format: fmt,
        detailLevel: selectedDetail,
        requestedSections: selectedSections,
        customTitle: customTitle || undefined
      });

      const newReport = res.data;
      setReports((prev) => [newReport, ...prev]);
      setActiveReport(newReport);
      setShowConfig(false);
    } catch (err) {
      setErrorMsg(err.message || 'Report generation failed');
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  }

  async function handleDownload(reportId, format) {
    try {
      const rep = reports.find((r) => r.id === reportId) || activeReport;
      const ext = format === 'MARKDOWN' ? 'md' : format.toLowerCase();
      const filename = `wrapai-${(content?.title || 'report').toLowerCase().replace(/\s+/g, '-')}.${ext}`;
      await reportService.downloadReport(reportId, filename);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  }

  async function handleOpenShare() {
    const targetReport = activeReport || reports[0];
    if (!targetReport) {
      alert('Please generate a report before sharing.');
      return;
    }

    try {
      const res = await reportService.shareReport(targetReport.id, { expiresInDays: 7 });
      setShareInfo(res.data);
      setShowShareModal(true);
    } catch (err) {
      alert(`Failed to create share link: ${err.message}`);
    }
  }

  async function handleRevokeShare() {
    if (!shareInfo?.reportId) return;
    try {
      await reportService.revokeShare(shareInfo.reportId);
      setShareInfo(null);
      setShowShareModal(false);
      alert('Share link revoked. Public access is disabled.');
    } catch (err) {
      alert(`Failed to revoke share link: ${err.message}`);
    }
  }

  const handleCopyLink = () => {
    if (shareInfo?.shareUrl) {
      navigator.clipboard.writeText(shareInfo.shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) return <LoadingState message="COMPILING INTELLIGENCE REPORT..." />;

  const displayData = activeReport?.structuredData || previewData;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 bg-white/70 border border-[#C7C7C7]">
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1351AA] block">
            {activeReport ? `REPORT V${activeReport.version} (${activeReport.format})` : 'LIVE REPORT PREVIEW'}
          </span>
          <p className="text-xs font-mono text-[#7A7A7A]">
            {activeReport ? `GENERATED ${formatDate(activeReport.createdAt)}` : 'DETERMINISTIC COMPILATION BASED ON RECORDING'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PosterButton
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            icon={Sliders}
          >
            {showConfig ? 'HIDE BUILDER' : 'CUSTOMIZE REPORT'}
          </PosterButton>

          {activeReport?.storageKey ? (
            <>
              <PosterButton
                variant="primary"
                size="sm"
                onClick={() => handleDownload(activeReport.id, activeReport.format)}
                icon={Download}
              >
                DOWNLOAD {activeReport.format}
              </PosterButton>
              <PosterButton
                variant="secondary"
                size="sm"
                onClick={handleOpenShare}
                icon={Share2}
              >
                SHARE
              </PosterButton>
            </>
          ) : (
            <PosterButton
              variant="primary"
              size="sm"
              onClick={() => handleGenerateReport('PDF')}
              disabled={isGenerating}
              icon={Sparkles}
            >
              {isGenerating ? generationStage || 'GENERATING...' : 'GENERATE PDF'}
            </PosterButton>
          )}
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <PosterButton variant="outline" size="sm" onClick={loadReportsAndPreview}>RETRY</PosterButton>
        </div>
      )}

      {/* Version Selector Chips */}
      {reports.length > 1 && (
        <div className="flex items-center space-x-2 p-2 bg-white/50 border border-[#C7C7C7] overflow-x-auto text-xs font-mono">
          <span className="text-[#7A7A7A] uppercase font-bold pl-2">VERSIONS:</span>
          {reports.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              className={`px-3 py-1 text-xs border transition-colors cursor-pointer uppercase ${
                activeReport?.id === rep.id
                  ? 'bg-[#141414] text-[#E3E2DE] border-[#141414]'
                  : 'bg-white text-[#141414] border-[#C7C7C7] hover:border-[#141414]'
              }`}
            >
              V{rep.version} • {rep.format} ({formatDate(rep.createdAt)})
            </button>
          ))}
        </div>
      )}

      {/* Custom Report Builder Panel */}
      {showConfig && (
        <div className="p-6 sm:p-8 bg-white/70 border border-[#C7C7C7] space-y-6">
          <div className="border-b border-[#C7C7C7] pb-4">
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414]">
              REPORT CUSTOMIZATION ENGINE
            </h3>
            <p className="text-xs text-[#444343] mt-1">
              Tailor document sections, detail levels, and export formats without re-running audio transcription or AI analysis.
            </p>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase text-[#7A7A7A]">
              1. CHOOSE REPORT TEMPLATE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    handleRefreshPreview();
                  }}
                  className={`p-4 border cursor-pointer transition-colors ${
                    selectedTemplate === tmpl.id
                      ? 'bg-white border-[#1351AA] border-2 shadow-none'
                      : 'bg-[#E3E2DE]/30 border-[#C7C7C7] hover:border-[#141414]'
                  }`}
                >
                  <div className="font-bold uppercase text-xs text-[#141414]">{tmpl.name}</div>
                  <div className="text-[10px] text-[#7A7A7A] mt-1">{tmpl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Format & Detail Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-[#7A7A7A]">
                2. EXPORT FORMAT
              </label>
              <div className="flex gap-2">
                {['PDF', 'DOCX', 'MARKDOWN', 'TXT'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`flex-1 py-2 font-mono text-xs font-bold uppercase border transition-colors cursor-pointer ${
                      selectedFormat === fmt
                        ? 'bg-[#141414] text-[#E3E2DE] border-[#141414]'
                        : 'bg-white text-[#141414] border-[#C7C7C7]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-[#7A7A7A]">
                3. DETAIL LEVEL
              </label>
              <div className="flex gap-2">
                {['BRIEF', 'STANDARD', 'DETAILED'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedDetail(lvl);
                      handleRefreshPreview();
                    }}
                    className={`flex-1 py-2 font-mono text-xs font-bold uppercase border transition-colors cursor-pointer ${
                      selectedDetail === lvl
                        ? 'bg-[#141414] text-[#E3E2DE] border-[#141414]'
                        : 'bg-white text-[#141414] border-[#C7C7C7]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase text-[#7A7A7A]">
              4. INCLUDE SECTIONS
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECTIONS_LIST.map((sec) => (
                <label
                  key={sec.id}
                  className="flex items-center space-x-2 text-xs p-3 bg-white border border-[#C7C7C7] cursor-pointer hover:border-[#1351AA]"
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(sec.id)}
                    onChange={() => toggleSection(sec.id)}
                    className="accent-[#1351AA]"
                  />
                  <span className="font-mono text-[11px] font-bold text-[#141414]">{sec.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#C7C7C7]">
            <PosterButton variant="outline" size="sm" onClick={handleRefreshPreview}>
              UPDATE LIVE PREVIEW
            </PosterButton>
            <PosterButton
              variant="primary"
              size="sm"
              disabled={isGenerating}
              onClick={() => handleGenerateReport()}
            >
              {isGenerating ? generationStage || 'GENERATING...' : `GENERATE ${selectedFormat} DOCUMENT`}
            </PosterButton>
          </div>
        </div>
      )}

      {/* Printable Report Preview Canvas */}
      <div className="bg-white border border-[#C7C7C7] p-8 sm:p-14 font-sans text-[#141414] space-y-10">
        <div className="border-b-2 border-[#141414] pb-8 space-y-4">
          <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">
            WRAPAI INTELLIGENCE SUITE • {displayData?.template || selectedTemplate} REPORT
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414]">
            {displayData?.title || content?.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#C7C7C7] text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">DATE</span>
              <span className="font-bold text-[#141414]">{formatDate(displayData?.metadata?.date || content?.createdAt)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">DURATION</span>
              <span className="text-[#141414]">{displayData?.metadata?.formattedDuration || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">PARTICIPANTS</span>
              <span className="text-[#141414]">{displayData?.metadata?.participantCount || 1} IDENTIFIED</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#7A7A7A] block font-bold">DETAIL LEVEL</span>
              <span className="text-[#141414]">{displayData?.detailLevel || selectedDetail}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {(displayData?.sections || []).map((sec) => (
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
          <span>CONFIDENTIAL</span>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareInfo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 bg-white border border-[#141414] space-y-6">
            <div className="flex items-center justify-between border-b border-[#C7C7C7] pb-4">
              <h3 className="font-bold uppercase tracking-tight text-lg text-[#141414] flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-[#1351AA]" />
                <span>SHARE REPORT</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-[#7A7A7A] hover:text-[#141414] text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-[#444343] leading-relaxed">
              Anyone with this link can view this read-only report. Transcripts and user settings remain protected.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareInfo.shareUrl}
                className="flex-1 p-2.5 text-xs font-mono bg-[#E3E2DE] border border-[#C7C7C7] select-all"
              />
              <PosterButton variant="primary" size="sm" onClick={handleCopyLink}>
                {isCopied ? 'COPIED' : 'COPY'}
              </PosterButton>
            </div>

            <div className="text-[10px] font-mono text-[#7A7A7A] uppercase">
              EXPIRES: {new Date(shareInfo.shareExpiresAt).toLocaleDateString()}
            </div>

            <div className="pt-4 border-t border-[#C7C7C7] flex items-center justify-between">
              <PosterButton variant="outline" size="sm" onClick={handleRevokeShare}>
                REVOKE LINK
              </PosterButton>
              <PosterButton variant="secondary" size="sm" onClick={() => setShowShareModal(false)}>
                DONE
              </PosterButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportTab;
