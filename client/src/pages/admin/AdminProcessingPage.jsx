import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { RefreshCw, Play, XOctagon } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function AdminProcessingPage() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getJobs();
        setJobs(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleRetry = (jobId) => {
    alert(`Re-enqueued Job ${jobId} to BullMQ queue.`);
  };

  if (isLoading) return <LoadingState message="Loading BullMQ queue inspector..." />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-charcoal flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">BULLMQ QUEUE TELEMETRY</span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-white mt-1">
            Processing Monitor
          </h1>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} className="border-brand-charcoal text-white">
          Refresh Queue
        </Button>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-brand-navy border border-brand-charcoal p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-xs font-bold text-brand-cyan">{job.id}</span>
                  <span className="text-brand-charcoal">|</span>
                  <Badge variant={job.status === 'Completed' ? 'success' : job.status === 'Failed' ? 'danger' : 'warning'}>
                    {job.status}
                  </Badge>
                </div>
                <h3 className="font-display text-xl uppercase tracking-wide text-brand-white">
                  {job.contentTitle}
                </h3>
                <p className="text-xs font-mono text-brand-sage mt-0.5">
                  User: {job.user} ({job.userEmail}) | Started: {formatDate(job.startedAt)}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {job.status === 'Failed' && (
                  <Button variant="primary" size="sm" onClick={() => handleRetry(job.id)} icon={RefreshCw}>
                    Retry Job
                  </Button>
                )}
              </div>
            </div>

            <ProgressBar progress={job.progress} label={`Current Stage: ${job.currentStage}`} className="text-white" />

            {job.errorMessage && (
              <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-xs font-mono text-red-300">
                ERROR: {job.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
