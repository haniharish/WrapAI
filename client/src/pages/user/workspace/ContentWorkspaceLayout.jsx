import React, { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { contentService } from '../../../services/contentService.js';
import { MediaPlayer } from '../../../components/media/MediaPlayer.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../components/common/LoadingState.jsx';
import {
  AlignLeft,
  FileText,
  Hash,
  ListOrdered,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import { formatDate, formatTimecode } from '../../../utils/formatters.js';

export function ContentWorkspaceLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await contentService.getContentById(id);
        setContent(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: AlignLeft },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'topics', label: 'Topics', icon: Hash },
    { id: 'key-points', label: 'Key Points', icon: ListOrdered },
    { id: 'highlights', label: 'Highlights', icon: Sparkles },
    { id: 'decisions', label: 'Decisions', icon: CheckCircle2 },
    { id: 'actions', label: 'Action Items', icon: CheckSquare },
    { id: 'report', label: 'Report', icon: FileCheck },
    { id: 'chat', label: 'Ask AI', icon: MessageSquare }
  ];

  // Extract active tab from pathname
  const currentPath = location.pathname.split('/').pop() || 'transcript';
  const activeTab = tabs.some((t) => t.id === currentPath) ? currentPath : 'transcript';

  const handleTabChange = (tabId) => {
    navigate(`/content/${id}/${tabId}`);
  };

  if (isLoading) {
    return <LoadingState message="Loading intelligence workspace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header Info */}
      <div className="bg-brand-white border border-brand-charcoal/15 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <Badge variant={content.contentType === 'VIDEO' ? 'blue' : 'sage'}>
                {content.contentType}
              </Badge>
              <span className="text-xs font-mono text-brand-taupe">{formatDate(content.createdAt)}</span>
              <span className="text-brand-taupe">|</span>
              <span className="text-xs font-mono text-brand-charcoal font-bold">
                {content.mediaDurationSeconds ? formatTimecode(content.mediaDurationSeconds) : 'Document'}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-brand-navy">
              {content.title}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 font-bold">
              {content.processingStatus}
            </span>
          </div>
        </div>

        {/* Media Player Component */}
        {content.mediaDurationSeconds && (
          <div className="mt-6">
            <MediaPlayer duration={content.mediaDurationSeconds} title={content.title} />
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-brand-white border border-brand-charcoal/15 px-4 shadow-sm">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* Tab Specific Content Pane */}
      <div className="min-h-[400px]">
        <Outlet context={{ content }} />
      </div>
    </div>
  );
}
