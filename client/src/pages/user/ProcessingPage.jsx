import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { processingService } from '../../services/processingService.js';
import { Card } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import {
  CheckCircle2,
  Clock,
  Cpu,
  ArrowRight,
  RefreshCw,
  XCircle,
  AlertCircle,
  Terminal,
  FileText
} from 'lucide-react';

const STAGES = [
  { id: 'QUEUED', label: 'Job Enqueued in BullMQ Queue' },
  { id: 'VALIDATING', label: 'Validating Media & Metadata Bounds' },
  { id: 'PREPARING', label: 'Preparing Execution Pipeline' },
  { id: 'TRANSCRIBING', label: 'Speech-to-Text Transcription' },
  { id: 'DIARIZING', label: 'Speaker Diarization & Timestamps' },
  { id: 'ANALYZING', label: 'Extracting Topics, Decisions & Actions' },
  { id: 'GENERATING_REPORT', label: 'Synthesizing Summary & Intelligence Report' }
];

export function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const pollingRef = useRef(null);

  const fetchStatus = async () => {
    try {
      // Try contentId first, then fallback to jobId
      let res;
      try {
        res = await processingService.getContentProcessingStatus(id);
      } catch {
        res = await processingService.getJobStatus(id);
      }

      if (res && res.data) {
        setJob(res.data);
        setError(null);

        // Stop polling if completed or failed or cancelled
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(res.data.status)) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve processing status');
    }
  };

  useEffect(() => {
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 1500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id]);

  const handleRetry = async () => {
    if (!job) return;
    setIsRetrying(true);
    try {
      const res = await processingService.retryProcessingJob(job.jobId || job.id);
      if (res && res.data) {
        setJob(res.data);
      }
      // Restart polling
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchStatus, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to retry processing job');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    setIsCancelling(true);
    try {
      const res = await processingService.cancelProcessingJob(job.jobId || job.id);
      if (res && res.data) {
        setJob(res.data);
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel processing job');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStageIndex = STAGES.findIndex((s) => s.id === job?.stage);
  const isCompleted = job?.status === 'COMPLETED';
  const isFailed = job?.status === 'FAILED';
  const isCancelled = job?.status === 'CANCELLED';

  const getStageStatus = (stageId, index) => {
    if (isCompleted) return 'COMPLETED';
    if (isFailed && job?.stage === stageId) return 'FAILED';
    if (isCancelled && job?.stage === stageId) return 'CANCELLED';
    if (currentStageIndex > index) return 'COMPLETED';
    if (currentStageIndex === index) return 'RUNNING';
    return 'PENDING';
  };

  return (
    <div className="relative max-w-3xl mx-auto py-12">
      <AmbientBackground />
      <Card className="relative z-10 p-8 sm:p-12 border border-brand-navy shadow-2xl">
        <div className="text-center mb-8">
          <span className="inline-block p-3 bg-brand-sage/30 text-brand-navy border border-brand-sage mb-4">
            <Cpu className={`w-8 h-8 ${!isCompleted && !isFailed && !isCancelled ? 'animate-pulse' : ''}`} />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-brand-navy">
            {isCompleted ? 'Content Wrapped & Ready' : isFailed ? 'Processing Failed' : isCancelled ? 'Processing Cancelled' : 'Wrapping Your Content'}
          </h1>
          <p className="text-xs text-brand-taupe mt-1 font-mono">
            JOB ID: {job?.jobId || id} | PIPELINE: FULL_AI_INTELLIGENCE
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-mono font-bold text-brand-navy mb-2">
            <span>Overall Pipeline Progress ({job?.stage || 'QUEUED'})</span>
            <span>{job?.progress || 0}%</span>
          </div>
          <ProgressBar progress={job?.progress || 0} />
        </div>

        {/* Multi-stage state checklist */}
        <div className="space-y-3 bg-brand-light/80 border border-brand-charcoal/15 p-6 mb-8">
          {STAGES.map((st, idx) => {
            const status = getStageStatus(st.id, idx);
            return (
              <div key={st.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : status === 'FAILED' ? (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  ) : status === 'CANCELLED' ? (
                    <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  ) : status === 'RUNNING' ? (
                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-brand-charcoal/30 flex-shrink-0" />
                  )}
                  <span className={status === 'RUNNING' ? 'font-bold text-brand-navy' : 'text-brand-charcoal'}>
                    {st.label}
                  </span>
                </div>
                <span className={`font-mono text-[10px] uppercase font-bold ${
                  status === 'COMPLETED' ? 'text-emerald-700' :
                  status === 'FAILED' ? 'text-red-700' :
                  status === 'CANCELLED' ? 'text-amber-700' :
                  status === 'RUNNING' ? 'text-brand-navy' : 'text-brand-taupe'
                }`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Failure Box with Retry Action */}
        {isFailed && (
          <div className="p-6 bg-red-50 border border-red-200 mb-8 space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase text-red-800">Processing Error Occurred</h4>
                <p className="text-xs text-red-700 mt-1 font-mono">
                  {job?.error?.message || 'An unexpected failure interrupted background processing.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={handleRetry}
                isLoading={isRetrying}
              >
                Retry Processing Job
              </Button>
            </div>
          </div>
        )}

        {/* Cancelled Box with Restart Action */}
        {isCancelled && (
          <div className="p-6 bg-amber-50 border border-amber-200 mb-8 space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase text-amber-800">Job Cancelled by User</h4>
                <p className="text-xs text-amber-700 mt-1">
                  This background job was cancelled. You can retry it at any time.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={handleRetry}
                isLoading={isRetrying}
              >
                Restart Processing
              </Button>
            </div>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <div className="text-center p-6 bg-emerald-50 border border-emerald-200 mb-8 space-y-4">
            <p className="text-sm font-bold text-emerald-800">
              Intelligence Extraction & Diarization Complete!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/content/${job?.contentId || id}`)}
              icon={ArrowRight}
              iconPosition="right"
            >
              Open Content Workspace
            </Button>
          </div>
        )}

        {/* Active Controls & Logs Accordion */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-brand-charcoal/10">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs font-mono text-brand-taupe hover:text-brand-navy flex items-center space-x-1"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showLogs ? 'Hide Execution Logs' : 'View Execution Logs'} ({job?.logs?.length || 0})</span>
          </button>

          {!isCompleted && !isFailed && !isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              isLoading={isCancelling}
              className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
            >
              Cancel Processing
            </Button>
          )}
        </div>

        {showLogs && (
          <div className="mt-4 p-4 bg-brand-navy text-brand-light font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
            {job?.logs && job.logs.length > 0 ? (
              job.logs.map((log, idx) => <div key={idx}>{log}</div>)
            ) : (
              <div className="text-brand-taupe italic">No logs recorded yet.</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
