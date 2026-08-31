import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { processingService } from '../../services/processingService.js';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { StatusLabel } from '../../components/ui/StatusLabel.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import {
  Check,
  X,
  AlertCircle,
  Terminal,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const STAGES = [
  { id: 'QUEUED', label: 'JOB ENQUEUED IN BULLMQ' },
  { id: 'VALIDATING', label: 'VALIDATING MEDIA AND BOUNDS' },
  { id: 'PREPARING', label: 'PREPARING NORMALIZATION PIPELINE' },
  { id: 'TRANSCRIBING', label: 'SPEECH-TO-TEXT TRANSCRIPTION' },
  { id: 'DIARIZING', label: 'SPEAKER DIARIZATION CLUSTERING' },
  { id: 'ANALYZING', label: 'EXTRACTING TOPICS, DECISIONS & ACTIONS' },
  { id: 'GENERATING_REPORT', label: 'SYNTHESIZING REPORT & VECTOR INDEXES' }
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
      let res;
      try {
        res = await processingService.getContentProcessingStatus(id);
      } catch {
        res = await processingService.getJobStatus(id);
      }

      if (res && res.data) {
        setJob(res.data);
        setError(null);

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
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            PIPELINE EXECUTION MONITOR
          </span>
          <h1 className="text-poster-section text-[#141414]">
            {isCompleted ? 'CONTENT READY.' : isFailed ? 'PROCESSING FAULT.' : 'PROCESSING ASSET.'}
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            JOB ID: {job?.jobId || id} • ASYNC BULLMQ WORKER
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Main Processing Canvas */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="EXECUTION PROGRESS" index="01">
          <div className="space-y-2 pt-2">
            <span className="font-mono text-3xl font-black text-[#141414] block">
              {job?.progress || 0}%
            </span>
            <StatusLabel status={job?.status || 'QUEUED'} />
          </div>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#141414] uppercase">
              <span>OVERALL PIPELINE STAGE: {job?.stage || 'QUEUED'}</span>
              <span>{job?.progress || 0}%</span>
            </div>
            <ProgressBar progress={job?.progress || 0} />
          </div>

          {/* Multi-stage state checklist */}
          <div className="divide-y divide-[#C7C7C7] border border-[#C7C7C7] bg-[#E3E2DE]/30">
            {STAGES.map((st, idx) => {
              const status = getStageStatus(st.id, idx);
              return (
                <div key={st.id} className="p-4 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-4">
                    <span className="text-[#7A7A7A] font-bold">0{idx + 1}</span>
                    <span className={status === 'RUNNING' ? 'font-bold text-[#1351AA]' : 'text-[#141414]'}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {status === 'COMPLETED' ? (
                      <span className="text-[#1b6b36] font-bold flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" /> COMPLETED
                      </span>
                    ) : status === 'FAILED' ? (
                      <span className="text-[#9e1c1c] font-bold flex items-center">
                        <X className="w-3.5 h-3.5 mr-1" /> FAILED
                      </span>
                    ) : status === 'RUNNING' ? (
                      <span className="text-[#1351AA] font-bold animate-pulse">
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="text-[#7A7A7A]">PENDING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Failure Box */}
          {isFailed && (
            <div className="p-6 bg-[#9e1c1c]/10 border border-[#9e1c1c] space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold uppercase text-[#9e1c1c]">PROCESSING ERROR OCCURRED</h4>
                <p className="text-xs font-mono text-[#141414]">
                  {job?.error?.message || 'An unexpected failure interrupted background processing.'}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <PosterButton
                  variant="primary"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'RETRYING...' : 'RETRY PROCESSING JOB'}
                </PosterButton>
              </div>
            </div>
          )}

          {/* Completed Box */}
          {isCompleted && (
            <div className="p-6 bg-[#1b6b36]/10 border border-[#1b6b36] text-center space-y-4">
              <p className="text-sm font-bold uppercase text-[#1b6b36]">
                INTELLIGENCE EXTRACTION & DIARIZATION COMPLETED SUCCESSFULLY
              </p>
              <PosterButton
                variant="primary"
                size="lg"
                onClick={() => navigate(`/content/${job?.contentId || id}`)}
                icon={ArrowRight}
              >
                OPEN CONTENT WORKSPACE
              </PosterButton>
            </div>
          )}

          {/* Active Controls & Logs */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-[#C7C7C7]">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-mono text-[#7A7A7A] hover:text-[#1351AA] flex items-center space-x-1.5 cursor-pointer uppercase"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showLogs ? 'HIDE EXECUTION LOGS' : 'VIEW EXECUTION LOGS'} ({job?.logs?.length || 0})</span>
            </button>

            {!isCompleted && !isFailed && !isCancelled && (
              <PosterButton
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'CANCELLING...' : 'CANCEL JOB'}
              </PosterButton>
            )}
          </div>

          {showLogs && (
            <div className="p-4 bg-[#141414] text-[#E3E2DE] font-mono text-xs max-h-48 overflow-y-auto space-y-1">
              {job?.logs && job.logs.length > 0 ? (
                job.logs.map((log, idx) => <div key={idx}>{log}</div>)
              ) : (
                <div className="text-[#7A7A7A] italic">NO LOGS RECORDED YET.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcessingPage;
