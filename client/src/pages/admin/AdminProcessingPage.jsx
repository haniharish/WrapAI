import React, { useState, useEffect } from 'react';
import { processingService } from '../../services/processingService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { RefreshCw, XOctagon } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function AdminProcessingPage() {
  const [jobs, setJobs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    try {
      const [jobsRes, metricsRes] = await Promise.all([
        processingService.getAdminAllJobs ? processingService.getAdminAllJobs({ limit: 50 }) : Promise.resolve({ data: [] }),
        processingService.getAdminQueueMetrics ? processingService.getAdminQueueMetrics() : Promise.resolve({ data: null })
      ]);
      setJobs(jobsRes.data || []);
      setMetrics(metricsRes.data || null);
    } catch (err) {
      console.error('Failed to load processing telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(loadData, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleRetry = async (jobId) => {
    setActionLoading((prev) => ({ ...prev, [jobId]: true }));
    try {
      if (processingService.retryProcessingJob) {
        await processingService.retryProcessingJob(jobId);
      }
      await loadData();
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleCancel = async (jobId) => {
    setActionLoading((prev) => ({ ...prev, [jobId]: true }));
    try {
      if (processingService.cancelProcessingJob) {
        await processingService.cancelProcessingJob(jobId);
      }
      await loadData();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  if (isLoading) return <LoadingState message="POLLING BULLMQ QUEUE TELEMETRY..." />;

  const queueCounts = metrics?.queue || { waiting: 0, active: 0, completed: 0, failed: 0 };
  const dbCounts = metrics?.database || { totalJobs: 0, activeJobs: 0, completedJobs: 0, failedJobs: 0 };

  return (
    <div className="space-y-8">
      {/* 1. Top Header */}
      <div className="pb-8 border-b border-[#444343] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#1351AA]">
            ASYNC BULLMQ QUEUE
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#E3E2DE]">
            PROCESSING <br />
            <span className="text-[#1351AA]">MONITOR.</span>
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-mono text-[#7A7A7A] cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-[#1351AA]"
            />
            <span>AUTO-REFRESH (3S)</span>
          </label>
          <PosterButton
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={RefreshCw}
          >
            REFRESH
          </PosterButton>
        </div>
      </div>

      {/* 2. Telemetry Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-[#444343] p-6 space-y-1">
          <span className="text-xs font-mono uppercase text-[#7A7A7A] block">WAITING IN QUEUE</span>
          <p className="text-2xl sm:text-3xl font-black text-[#E3E2DE]">{queueCounts.waiting || 0}</p>
          <span className="text-[10px] text-[#1351AA] font-mono block font-bold">REDIS BUFFER</span>
        </div>

        <div className="bg-black/40 border border-[#444343] p-6 space-y-1">
          <span className="text-xs font-mono uppercase text-[#7A7A7A] block">ACTIVE WORKERS</span>
          <p className="text-2xl sm:text-3xl font-black text-[#1351AA]">{queueCounts.active || dbCounts.activeJobs || 0}</p>
          <span className="text-[10px] text-[#7A7A7A] font-mono block">2 SLOTS CONCURRENT</span>
        </div>

        <div className="bg-black/40 border border-[#444343] p-6 space-y-1">
          <span className="text-xs font-mono uppercase text-[#7A7A7A] block">COMPLETED JOBS</span>
          <p className="text-2xl sm:text-3xl font-black text-[#1b6b36]">{dbCounts.completedJobs || 0}</p>
          <span className="text-[10px] text-[#7A7A7A] font-mono block">SUCCESSFUL RUNS</span>
        </div>

        <div className="bg-black/40 border border-[#444343] p-6 space-y-1">
          <span className="text-xs font-mono uppercase text-[#7A7A7A] block">FAILED JOBS</span>
          <p className="text-2xl sm:text-3xl font-black text-[#9e1c1c]">{dbCounts.failedJobs || 0}</p>
          <span className="text-[10px] text-[#9e1c1c] font-mono block font-bold">REQUIRES RETRY</span>
        </div>
      </div>

      {/* 3. Jobs List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="bg-black/40 border border-[#444343] p-12 text-center text-[#7A7A7A] font-mono text-xs uppercase">
            NO PROCESSING JOBS CURRENTLY IN QUEUE.
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id || job._id} className="bg-black/40 border border-[#444343] p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#1351AA]">{job.jobId || job.id}</span>
                    <span className="text-[#444343]">|</span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#141414] text-[#E3E2DE] border border-[#444343]">
                      {job.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-[#E3E2DE]">
                    {job.contentId?.title || 'PROCESSED ASSET'}
                  </h3>
                  <p className="text-xs font-mono text-[#7A7A7A] mt-1">
                    USER: {job.userId?.fullName || 'USER'} | STAGE: {job.stage || 'QUEUED'} | {formatDate(job.createdAt)}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {['FAILED', 'CANCELLED'].includes(job.status) && (
                    <PosterButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleRetry(job.jobId || job.id)}
                      disabled={actionLoading[job.jobId || job.id]}
                      icon={RefreshCw}
                    >
                      RETRY JOB
                    </PosterButton>
                  )}
                  {['QUEUED', 'PROCESSING'].includes(job.status) && (
                    <PosterButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(job.jobId || job.id)}
                      disabled={actionLoading[job.jobId || job.id]}
                      icon={XOctagon}
                    >
                      CANCEL JOB
                    </PosterButton>
                  )}
                </div>
              </div>

              <ProgressBar progress={job.progress || 0} label={`PROGRESS: ${job.stage || 'QUEUED'} (${job.progress || 0}%)`} />

              {job.error && (
                <div className="p-3 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-xs font-mono text-[#9e1c1c]">
                  ERROR: {job.error.message || JSON.stringify(job.error)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminProcessingPage;
