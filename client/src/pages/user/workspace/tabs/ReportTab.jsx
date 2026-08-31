import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { reportService } from '../../../../services/reportService.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import {
  Download,
  RefreshCw,
  FileCheck,
  Share2,
  Sliders,
  CheckSquare,
  FileText,
  Copy,
  ExternalLink,
  Check,
  Clock,
  Users,
  Award,
  ListOrdered,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '../../../../utils/formatters.js';

const TEMPLATES = [
  { id: 'MEETING', name: 'Meeting Minutes', desc: 'Summary, decisions, action items, attendance' },
  { id: 'EXECUTIVE', name: 'Executive Brief', desc: 'High-level strategic digest & critical outcomes' },
  { id: 'LECTURE', name: 'Lecture Notes', desc: 'Study notes, core concepts, review questions' },
  { id: 'INTERVIEW', name: 'Interview Summary', desc: 'Candidate competencies, responses, highlights' },
  { id: 'GENERAL', name: 'General Report', desc: 'Standard content analysis & takeaways' }
];

const SECTIONS_LIST = [
  { id: 'SUMMARY', label: 'Executive Summary' },
  { id: 'TOPICS', label: 'Topics Discussed' },
  { id: 'DECISIONS', label: 'Agreed Decisions' },
  { id: 'ACTION_ITEMS', label: 'Action Item Registry' },
  { id: 'KEY_POINTS', label: 'Key Points & Takeaways' },
  { id: 'QUESTIONS', label: 'Questions Raised' },
  { id: 'HIGHLIGHTS', label: 'Key Highlights' },
  { id: 'PARTICIPANTS', label: 'Participants & Speakers' }
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

  // Load existing reports and initial live preview
  useEffect(() => {
    loadReportsAndPreview();
  }, [id]);

  async function loadReportsAndPreview() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Load existing generated reports for this content
      const reportsRes = await reportService.getContentReports(id);
      const fetchedReports = reportsRes.data || [];
      setReports(fetchedReports);

      if (fetchedReports.length > 0) {
        setActiveReport(fetchedReports[0]);
      }

      // 2. Fetch live preview
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
    setGenerationStage('Building Structured Report...');

    try {
      setTimeout(() => setGenerationStage('Rendering Document...'), 400);
      setTimeout(() => setGenerationStage('Uploading to Secure Storage...'), 800);

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

  if (isLoading) return <LoadingState message="Compiling intelligence report preview..." />;

  const displayData = activeReport?.structuredData || previewData;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-white border border-brand-charcoal/15 shadow-sm">
        <div className="flex items-center space-x-3">
          <FileCheck className="w-5 h-5 text-emerald-700" />
          <div>
            <span className="font-display text-lg uppercase text-brand-navy">
              {activeReport ? `Report v${activeReport.version} (${activeReport.format})` : 'Report Preview Ready'}
            </span>
            <p className="text-[11px] font-mono text-brand-taupe">
              {activeReport ? `Generated ${formatDate(activeReport.createdAt)}` : 'Live structured preview based on existing AI analysis'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            icon={Sliders}
          >
            {showConfig ? 'Hide Builder' : 'Customize Report'}
          </Button>

          {activeReport?.storageKey ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownload(activeReport.id, activeReport.format)}
                icon={Download}
              >
                Download {activeReport.format}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenShare}
                icon={Share2}
              >
                Share
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerateReport('PDF')}
              disabled={isGenerating}
              icon={Sparkles}
            >
              {isGenerating ? generationStage || 'Generating...' : 'Generate PDF'}
            </Button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadReportsAndPreview}>Retry</Button>
        </div>
      )}

      {/* Version Selector Chips */}
      {reports.length > 1 && (
        <div className="flex items-center space-x-2 p-2 bg-brand-light border border-brand-charcoal/10 overflow-x-auto text-xs">
          <span className="font-mono text-brand-taupe uppercase text-[10px] pl-2">Versions:</span>
          {reports.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep)}
              className={`px-3 py-1 font-mono text-xs border transition-all ${
                activeReport?.id === rep.id
                  ? 'bg-brand-navy text-brand-white border-brand-navy'
                  : 'bg-brand-white text-brand-charcoal border-brand-charcoal/20 hover:border-brand-charcoal/40'
              }`}
            >
              v{rep.version} • {rep.format} ({formatDate(rep.createdAt)})
            </button>
          ))}
        </div>
      )}

      {/* Custom Report Builder Panel */}
      {showConfig && (
        <Card className="p-6 border-brand-charcoal/20 bg-brand-light space-y-6">
          <div className="border-b border-brand-charcoal/15 pb-3">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
              Report Customization Engine
            </h3>
            <p className="text-xs text-brand-taupe">
              Tailor document sections, detail levels, and export formats without re-running audio transcription or AI analysis.
            </p>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-2">
              1. Choose Report Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    handleRefreshPreview();
                  }}
                  className={`p-3 border cursor-pointer transition-all ${
                    selectedTemplate === tmpl.id
                      ? 'bg-brand-white border-brand-navy ring-1 ring-brand-navy shadow-sm'
                      : 'bg-brand-white/60 border-brand-charcoal/15 hover:border-brand-charcoal/30'
                  }`}
                >
                  <div className="font-display uppercase text-sm text-brand-navy">{tmpl.name}</div>
                  <div className="text-[11px] text-brand-taupe mt-1">{tmpl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Format & Detail Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-2">
                2. Export Format
              </label>
              <div className="flex gap-2">
                {['PDF', 'DOCX', 'MARKDOWN', 'TXT'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`flex-1 py-2 font-mono text-xs border transition-all uppercase ${
                      selectedFormat === fmt
                        ? 'bg-brand-navy text-brand-white border-brand-navy'
                        : 'bg-brand-white text-brand-charcoal border-brand-charcoal/20'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-2">
                3. Detail Level
              </label>
              <div className="flex gap-2">
                {['BRIEF', 'STANDARD', 'DETAILED'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedDetail(lvl);
                      handleRefreshPreview();
                    }}
                    className={`flex-1 py-2 font-mono text-xs border transition-all uppercase ${
                      selectedDetail === lvl
                        ? 'bg-brand-navy text-brand-white border-brand-navy'
                        : 'bg-brand-white text-brand-charcoal border-brand-charcoal/20'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-brand-charcoal mb-2">
              4. Include Sections
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECTIONS_LIST.map((sec) => (
                <label
                  key={sec.id}
                  className="flex items-center space-x-2 text-xs p-2 bg-brand-white border border-brand-charcoal/15 cursor-pointer hover:bg-brand-light"
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(sec.id)}
                    onChange={() => toggleSection(sec.id)}
                    className="accent-brand-navy"
                  />
                  <span className="text-brand-charcoal">{sec.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-brand-charcoal/15">
            <Button variant="outline" size="sm" onClick={handleRefreshPreview}>
              Update Live Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isGenerating}
              onClick={() => handleGenerateReport()}
              icon={Sparkles}
            >
              {isGenerating ? generationStage || 'Generating Document...' : `Generate ${selectedFormat} Document`}
            </Button>
          </div>
        </Card>
      )}

      {/* Printable Report Preview Canvas */}
      <div className="bg-brand-white border border-brand-charcoal/20 p-8 sm:p-12 shadow-lg font-sans text-brand-navy space-y-8">
        {/* Document Header */}
        <div className="border-b-2 border-brand-navy pb-6">
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand-taupe uppercase">
            WRAPAI INTELLIGENCE SUITE • {displayData?.template || selectedTemplate} REPORT
          </span>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider text-brand-navy mt-1">
            {displayData?.title || content?.title}
          </h1>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-3 bg-brand-light border border-brand-charcoal/15 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">DATE</span>
              <span className="font-semibold text-brand-charcoal">{formatDate(displayData?.metadata?.date || content?.createdAt)}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">DURATION</span>
              <span className="font-semibold text-brand-charcoal">{displayData?.metadata?.formattedDuration || 'N/A'}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">PARTICIPANTS</span>
              <span className="font-semibold text-brand-charcoal">{displayData?.metadata?.participantCount || 1} identified</span>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe block">DETAIL LEVEL</span>
              <span className="font-semibold text-brand-charcoal">{displayData?.detailLevel || selectedDetail}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {(displayData?.sections || []).map((sec) => (
          <div key={sec.id} className="space-y-3">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy border-b border-brand-charcoal/15 pb-1 flex items-center justify-between">
              <span>{sec.title}</span>
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

        {/* Footer */}
        <div className="border-t border-brand-charcoal/15 pt-6 text-center text-[10px] font-mono text-brand-taupe flex items-center justify-between">
          <span>WrapAI Intelligence Platform</span>
          <span>From Content to Clarity</span>
          <span>Confidential</span>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareInfo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-brand-white border border-brand-charcoal/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-charcoal/15 pb-3">
              <h3 className="font-display text-lg uppercase tracking-wide text-brand-navy flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-brand-navy" />
                <span>Share Intelligence Report</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-brand-taupe hover:text-brand-navy text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-brand-charcoal">
              Anyone with this link can view this read-only report. Transcripts and private user details remain protected.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareInfo.shareUrl}
                className="flex-1 p-2 text-xs font-mono bg-brand-light border border-brand-charcoal/20 select-all"
              />
              <Button variant="primary" size="sm" onClick={handleCopyLink} icon={isCopied ? Check : Copy}>
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="text-[11px] font-mono text-brand-taupe">
              Expires: {new Date(shareInfo.shareExpiresAt).toLocaleDateString()}
            </div>

            <div className="pt-3 border-t border-brand-charcoal/15 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleRevokeShare} className="text-rose-600 border-rose-200">
                Revoke Link
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowShareModal(false)}>
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
