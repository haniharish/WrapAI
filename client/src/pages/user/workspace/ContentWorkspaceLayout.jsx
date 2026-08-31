import React, { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { contentService } from '../../../services/contentService.js';
import { MediaPlayer } from '../../../components/media/MediaPlayer.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { PosterButton } from '../../../components/ui/PosterButton.jsx';
import { StatusLabel } from '../../../components/ui/StatusLabel.jsx';
import { LoadingState } from '../../../components/common/LoadingState.jsx';
import { CommentsPanel } from '../../../components/collaboration/CommentsPanel.jsx';
import {
  AlignLeft,
  FileText,
  Hash,
  ListOrdered,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  FileCheck,
  MessageSquare,
  MessageCircle
} from 'lucide-react';
import { formatDate, formatTimecode } from '../../../utils/formatters.js';

export function ContentWorkspaceLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  const currentSeconds = useSelector((state) => state.workspace.currentPlaybackSeconds || 0);

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
    { id: 'transcript', label: 'TRANSCRIPT', icon: AlignLeft },
    { id: 'summary', label: 'SUMMARY', icon: FileText },
    { id: 'topics', label: 'TOPICS', icon: Hash },
    { id: 'key-points', label: 'KEY POINTS', icon: ListOrdered },
    { id: 'highlights', label: 'HIGHLIGHTS', icon: Sparkles },
    { id: 'decisions', label: 'DECISIONS', icon: CheckCircle2 },
    { id: 'actions', label: 'ACTION ITEMS', icon: CheckSquare },
    { id: 'report', label: 'REPORT', icon: FileCheck },
    { id: 'chat', label: 'ASK AI', icon: MessageSquare }
  ];

  const currentPath = location.pathname.split('/').pop() || 'transcript';
  const activeTab = tabs.some((t) => t.id === currentPath) ? currentPath : 'transcript';

  const handleTabChange = (tabId) => {
    navigate(`/content/${id}/${tabId}`);
  };

  if (isLoading) {
    return <LoadingState message="LOADING INTELLIGENCE WORKSPACE..." />;
  }

  if (!content) {
    return (
      <div className="bg-white/70 border border-[#C7C7C7] p-12 text-center space-y-4">
        <h2 className="text-2xl font-black uppercase text-[#141414]">CONTENT NOT FOUND</h2>
        <p className="text-xs font-mono text-[#7A7A7A]">The requested content item could not be retrieved.</p>
        <PosterButton variant="primary" size="sm" onClick={() => navigate('/content')}>
          BACK TO CONTENT LIBRARY
        </PosterButton>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Workspace Header Info */}
      <div className="bg-white/70 border border-[#C7C7C7] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="px-2.5 py-1 bg-[#141414] text-[#E3E2DE] font-bold uppercase">
                {content.contentType}
              </span>
              <span className="text-[#7A7A7A]">{formatDate(content.createdAt)}</span>
              <span className="text-[#C7C7C7]">|</span>
              <span className="text-[#141414] font-bold">
                {content.mediaDurationSeconds ? formatTimecode(content.mediaDurationSeconds) : 'DOCUMENT'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[#141414]">
              {content.title}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <PosterButton
              variant={showNotesDrawer ? 'primary' : 'outline'}
              size="sm"
              icon={MessageCircle}
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            >
              {showNotesDrawer ? 'HIDE NOTES' : 'COLLABORATION NOTES'}
            </PosterButton>

            <StatusLabel status={content.processingStatus} />
          </div>
        </div>

        {/* Media Player Component */}
        {content.mediaDurationSeconds && (
          <div>
            <MediaPlayer duration={content.mediaDurationSeconds} title={content.title} />
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="bg-white/70 border border-[#C7C7C7] px-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* 3. Tab Specific Content Pane + Optional Collaboration Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[400px]">
        <div className={showNotesDrawer ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <Outlet context={{ content }} />
        </div>

        {showNotesDrawer && (
          <div className="lg:col-span-4 h-full">
            <CommentsPanel
              contentId={id}
              currentTimestamp={currentSeconds}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentWorkspaceLayout;
