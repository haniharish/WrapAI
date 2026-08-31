import React, { useState, useEffect } from 'react';
import { processingService } from '../../services/processingService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { RefreshCw, Play, XOctagon, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';
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
        processingService.getAdminAllJobs({ limit: 50 }),
        processingService.getAdminQueueMetrics()
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
      await processingService.retryProcessingJob(jobId);
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
      await processingService.cancelProcessingJob(jobId);
      await loadData();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  if (isLoading) return <LoadingState message="Loading BullMQ queue telemetry..." />;

  const queueCounts = metrics?.queue || { waiting: 0, active: 0, completed: 0, failed: 0 };
  const dbCounts = metrics?.database || { totalJobs: 0, activeJobs: 0, completedJobs: 0, failedJobs: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-brand-charcoal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">BULLMQ QUEUE TELEMETRY</span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
            Processing Monitor
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-mono text-brand-sage cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-brand-navy border-brand-charcoal"
            />
            <span>Auto-refresh (3s)</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={RefreshCw}
            className="border-brand-charcoal text-white hover:bg-brand-charcoal"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-brand-navy border border-brand-charcoal p-4">
          <div className="flex items-center space-x-2 text-brand-sage mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Waiting in Queue</span>
          </div>
          <p className="font-display text-3xl text-brand-white">{queueCounts.waiting || 0}</p>
          <span className="text-[10px] text-brand-sage font-mono">Redis buffer</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-4">
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Layers className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-mono uppercase font-bold">Active Workers</span>
          </div>
          <p className="font-display text-3xl text-brand-cyan">{queueCounts.active || dbCounts.activeJobs || 0}</p>
          <span className="text-[10px] text-brand-sage font-mono">Concurrent slots: 2</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-4">
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Completed Jobs</span>
          </div>
          <p className="font-display text-3xl text-emerald-400">{dbCounts.completedJobs || 0}</p>
          <span className="text-[10px] text-brand-sage font-mono">Successfully processed</span>
        </div>

        <div className="bg-brand-navy border border-brand-charcoal p-4">
          <div className="flex items-center space-x-2 text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Failed Jobs</span>
          </div>
          <p className="font-display text-3xl text-red-400">{dbCounts.failedJobs || 0}</p>
          <span className="text-[10px] text-brand-sage font-mono">Requires retry</span>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="bg-brand-navy border border-brand-charcoal p-8 text-center text-brand-sage font-mono text-xs">
            No processing jobs currently in queue or database.
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id || job._id} className="bg-brand-navy border border-brand-charcoal p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-bold text-brand-cyan">{job.jobId || job.id}</span>
                    <span className="text-brand-charcoal">|</span>
                    <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : job.status === 'CANCELLED' ? 'neutral' : 'warning'}>
                      {job.status}
                    </Badge>
                  </div>
                  <h3 className="font-display text-xl uppercase tracking-wide text-brand-white">
                    {job.contentId?.title || 'Processed Media Stream'}
                  </h3>
                  <p className="text-xs font-mono text-brand-sage mt-0.5">
                    User: {job.userId?.fullName || 'User'} ({job.userId?.email || 'N/A'}) | Stage: {job.stage || 'QUEUED'} | Created: {formatDate(job.createdAt)}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {['FAILED', 'CANCELLED'].includes(job.status) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRetry(job.jobId || job.id)}
                      isLoading={actionLoading[job.jobId || job.id]}
                      icon={RefreshCw}
                    >
                      Retry Job
                    </Button>
                  )}
                  {['QUEUED', 'PROCESSING'].includes(job.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(job.jobId || job.id)}
                      isLoading={actionLoading[job.jobId || job.id]}
                      icon={XOctagon}
                      className="border-red-700 text-red-400 hover:bg-red-950/40"
                    >
                      Cancel Job
                    </Button>
                  )}
                </div>
              </div>

              <ProgressBar progress={job.progress || 0} label={`Progress: ${job.stage || 'QUEUED'} (${job.progress || 0}%)`} className="text-white" />

              {job.error && (
                <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-xs font-mono text-red-300">
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
