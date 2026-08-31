import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { contentService } from '../../services/contentService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import {
  UploadCloud,
  FileText,
  Clock,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Mic,
  Video,
  Link2,
  Sparkles
} from 'lucide-react';
import { formatTimecode, formatDate } from '../../utils/formatters.js';

export function UserDashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await contentService.getContentList();
        setContentList(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalItems = contentList.length;
  const processedItems = contentList.filter((c) => c.processingStatus === 'COMPLETED').length;
  const totalHours = Math.round(
    contentList.reduce((acc, c) => acc + (c.mediaDurationSeconds || 0), 0) / 3600
  );
  const reportsGenerated = contentList.filter((c) => c.hasReport).length;

  return (
    <div className="space-y-10">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-brand-charcoal/15">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">
            INTELLIGENCE OVERVIEW
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-brand-navy mt-1">
            Good Morning, {user?.fullName?.split(' ')[0] || 'User'}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/upload">
            <Button variant="primary" size="md" icon={UploadCloud}>
              Upload Content
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Compact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Content"
          value={totalItems}
          subtext="Ingested assets"
          icon={FolderOpen}
          trend="+3 this week"
        />
        <StatCard
          label="Processed"
          value={processedItems}
          subtext="Ready for analysis"
          icon={CheckCircle2}
        />
        <StatCard
          label="Hours Analyzed"
          value={`${totalHours}h`}
          subtext="Audio & video media"
          icon={Clock}
        />
        <StatCard
          label="Reports Generated"
          value={reportsGenerated}
          subtext="Minutes & summaries"
          icon={FileText}
        />
      </div>

      {/* Quick Ingestion Action Banner */}
      <Card className="bg-gradient-to-r from-brand-navy to-brand-charcoal text-brand-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] font-mono uppercase bg-brand-cyan text-brand-navy px-2 py-0.5 font-bold tracking-widest">
              QUICK WRAP
            </span>
            <h3 className="font-display text-3xl uppercase tracking-wide mt-2">
              Transform Your Next Meeting or Recording
            </h3>
            <p className="text-xs text-brand-sage mt-1">
              Provide an audio/video recording, document text, or supported URL to instantly generate transcripts, speakers, decisions, and action items.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/upload?type=AUDIO">
              <Button variant="secondary" size="sm" icon={Mic}>Audio</Button>
            </Link>
            <Link to="/upload?type=VIDEO">
              <Button variant="secondary" size="sm" icon={Video}>Video</Button>
            </Link>
            <Link to="/upload?type=URL">
              <Button variant="secondary" size="sm" icon={Link2}>URL</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Recent Content Library Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">
            Recent Content
          </h2>
          <Link to="/content" className="text-xs font-bold uppercase tracking-wider text-brand-navy hover:underline flex items-center">
            View All Content <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingState message="Loading your content items..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentList.slice(0, 3).map((item) => (
              <Card key={item.id} hover className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={item.contentType === 'VIDEO' ? 'blue' : item.contentType === 'AUDIO' ? 'sage' : 'beige'}>
                      {item.contentType}
                    </Badge>
                    <span className="text-[11px] font-mono text-brand-taupe">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <Link to={`/content/${item.id}`}>
                    <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy hover:text-brand-charcoal line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-brand-taupe line-clamp-2 mb-4">{item.description}</p>
                </div>

                <div className="pt-4 border-t border-brand-charcoal/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-brand-charcoal">
                    {item.mediaDurationSeconds ? formatTimecode(item.mediaDurationSeconds) : 'Document'}
                  </span>

                  <Link to={`/content/${item.id}`}>
                    <Button variant="outline" size="sm">
                      Open Workspace
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
