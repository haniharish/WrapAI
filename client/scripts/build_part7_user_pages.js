// client/scripts/build_part7_user_pages.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/pages/user/UserDashboardPage.jsx
write('src/pages/user/UserDashboardPage.jsx', `
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
          value={\`\${totalHours}h\`}
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

                  <Link to={\`/content/\${item.id}\`}>
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

                  <Link to={\`/content/\${item.id}\`}>
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
`);

// 2. src/pages/user/UploadPage.jsx
write('src/pages/user/UploadPage.jsx', `
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { contentService } from '../../services/contentService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import {
  UploadCloud,
  Mic,
  Video,
  FileText,
  Link2,
  File,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

export function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'AUDIO';

  const [activeTab, setActiveTab] = useState(initialType);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const tabs = [
    { id: 'AUDIO', label: 'Audio', icon: Mic },
    { id: 'VIDEO', label: 'Video', icon: Video },
    { id: 'DOCUMENT', label: 'Document', icon: FileText },
    { id: 'LINK', label: 'URL Link', icon: Link2 },
    { id: 'TEXT', label: 'Raw Text', icon: File }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      type: activeTab,
      title: data.title || selectedFile?.name || 'Untitled Upload',
      description: data.description,
      file: selectedFile,
      url: data.url,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : ['Upload']
    };

    const res = await contentService.uploadContent(payload);
    // Navigate to simulated processing screen
    navigate(\`/processing/\${res.data.id}\`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">CONTENT INGESTION</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Upload & Ingest Content
        </h1>
        <p className="text-xs text-brand-taupe mt-1">
          Supported formats: MP3, WAV, M4A, MP4, MOV, TXT documents, or supported media URLs.
        </p>
      </div>

      <Card className="p-8">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Zone for AUDIO, VIDEO, DOCUMENT */}
          {['AUDIO', 'VIDEO', 'DOCUMENT'].includes(activeTab) && (
            <div>
              {!selectedFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={\`border-2 border-dashed p-12 text-center transition-all \${
                    dragActive ? 'border-brand-navy bg-brand-sage/20' : 'border-brand-charcoal/20 bg-brand-light/40'
                  }\`}
                >
                  <UploadCloud className="w-12 h-12 text-brand-navy mx-auto mb-4 opacity-70" />
                  <p className="font-display text-xl uppercase text-brand-navy mb-1">
                    Drag and drop your {activeTab.toLowerCase()} file here
                  </p>
                  <p className="text-xs text-brand-taupe mb-4">
                    Maximum file size: 500 MB (Direct-to-S3 signed storage)
                  </p>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-brand-navy text-brand-white text-xs font-bold uppercase tracking-wider hover:bg-brand-charcoal">
                      Browse Local Files
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept={
                        activeTab === 'AUDIO'
                          ? 'audio/*'
                          : activeTab === 'VIDEO'
                          ? 'video/*'
                          : '.txt,.doc,.docx'
                      }
                    />
                  </label>
                </div>
              ) : (
                /* Selected File Preview */
                <div className="p-4 bg-brand-light border border-brand-navy flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-6 h-6 text-brand-navy" />
                    <div>
                      <p className="text-xs font-bold text-brand-navy">{selectedFile.name}</p>
                      <p className="text-[10px] font-mono text-brand-taupe">
                        {formatBytes(selectedFile.size)} | {selectedFile.type || 'Unknown MIME'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-brand-taupe hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {activeTab === 'LINK' && (
            <Input
              label="Remote Multimedia URL"
              icon={Link2}
              placeholder="https://youtube.com/watch?v=... or direct MP3/MP4 link"
              {...register('url')}
            />
          )}

          {/* Raw Text Input */}
          {activeTab === 'TEXT' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                Paste Raw Text / Transcript
              </label>
              <textarea
                rows={6}
                placeholder="Paste verbatim discussion, meeting transcript, or notes..."
                className="w-full bg-brand-white border border-brand-charcoal/20 p-4 text-sm text-brand-navy focus:outline-none focus:border-brand-navy font-mono"
                {...register('rawText')}
              />
            </div>
          )}

          {/* Common Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-charcoal/10">
            <Input
              label="Content Title (Optional)"
              placeholder="e.g. Q3 Engineering Architecture Sync"
              {...register('title')}
            />
            <Input
              label="Tags (Comma separated)"
              placeholder="Engineering, Database, Sprint"
              {...register('tags')}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Sparkles}
              isLoading={isSubmitting}
              disabled={!selectedFile && activeTab !== 'LINK' && activeTab !== 'TEXT'}
            >
              Start Processing
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
`);

// 3. src/pages/user/ProcessingPage.jsx
write('src/pages/user/ProcessingPage.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { CheckCircle2, Clock, Cpu, ArrowRight } from 'lucide-react';

export function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);
  const [stageIndex, setStageIndex] = useState(1);

  const stages = [
    { label: 'Upload & Verification', status: 'COMPLETED' },
    { label: 'FFmpeg Audio Normalization (16kHz WAV)', status: stageIndex > 0 ? 'COMPLETED' : 'RUNNING' },
    { label: 'Whisper Speech-to-Text Transcription', status: stageIndex > 1 ? 'COMPLETED' : stageIndex === 1 ? 'RUNNING' : 'PENDING' },
    { label: 'pyannote Speaker Diarization', status: stageIndex > 2 ? 'COMPLETED' : stageIndex === 2 ? 'RUNNING' : 'PENDING' },
    { label: 'Structured LLM Intelligence Extraction', status: stageIndex > 3 ? 'COMPLETED' : stageIndex === 3 ? 'RUNNING' : 'PENDING' },
    { label: 'Atlas Vector Embeddings & Indexing', status: stageIndex > 4 ? 'COMPLETED' : stageIndex === 4 ? 'RUNNING' : 'PENDING' }
  ];

  // Simulate progress across stages
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 12;
        if (next >= 30 && stageIndex < 2) setStageIndex(2);
        if (next >= 55 && stageIndex < 3) setStageIndex(3);
        if (next >= 78 && stageIndex < 4) setStageIndex(4);
        if (next >= 95 && stageIndex < 5) setStageIndex(5);
        return next > 100 ? 100 : next;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [stageIndex]);

  return (
    <div className="relative max-w-3xl mx-auto py-12">
      <AmbientBackground />
      <Card className="relative z-10 p-8 sm:p-12 border border-brand-navy shadow-2xl">
        <div className="text-center mb-8">
          <span className="inline-block p-3 bg-brand-sage/30 text-brand-navy border border-brand-sage mb-4">
            <Cpu className="w-8 h-8 animate-pulse" />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-brand-navy">
            Wrapping Your Content
          </h1>
          <p className="text-xs text-brand-taupe mt-1 font-mono">
            JOB ID: {id} | PIPELINE: AUDIO_STT_DIARIZATION_RAG
          </p>
        </div>

        <ProgressBar progress={progress} label="Overall Pipeline Progress" className="mb-8" />

        {/* Multi-stage state checklist */}
        <div className="space-y-3 bg-brand-light/80 border border-brand-charcoal/15 p-6 mb-8">
          {stages.map((st, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                {st.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : st.status === 'RUNNING' ? (
                  <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-brand-charcoal/30" />
                )}
                <span className={st.status === 'RUNNING' ? 'font-bold text-brand-navy' : 'text-brand-charcoal'}>
                  {st.label}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase text-brand-taupe font-bold">
                {st.status}
              </span>
            </div>
          ))}
        </div>

        {progress >= 100 && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-300">
            <p className="text-sm font-bold text-emerald-800 mb-4">
              Intelligence Extraction & Diarization Complete!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/content/cnt_01')}
              icon={ArrowRight}
              iconPosition="right"
            >
              Open Content Workspace
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
`);

// 4. src/pages/user/MyContentPage.jsx
write('src/pages/user/MyContentPage.jsx', `
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentService } from '../../services/contentService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import {
  Search,
  Grid,
  List,
  UploadCloud,
  MoreVertical,
  Trash2,
  Edit2,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatTimecode, formatDate } from '../../utils/formatters.js';

export function MyContentPage() {
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  // Rename modal state
  const [renameModalItem, setRenameModalItem] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await contentService.getContentList({
        search,
        type: typeFilter,
        status: statusFilter
      });
      setContentList(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, typeFilter, statusFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content item?')) {
      await contentService.deleteContent(id);
      loadData();
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameModalItem || !newTitle.trim()) return;
    await contentService.updateContent(renameModalItem.id, { title: newTitle });
    setRenameModalItem(null);
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-charcoal/15">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">LIBRARY REPOSITORY</span>
          <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
            My Content
          </h1>
        </div>
        <Link to="/upload">
          <Button variant="primary" size="md" icon={UploadCloud}>
            Upload Content
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-brand-white p-4 border border-brand-charcoal/15">
        <div className="w-full md:w-96">
          <Input
            icon={Search}
            placeholder="Search by title or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Media Types' },
              { value: 'AUDIO', label: 'Audio Files' },
              { value: 'VIDEO', label: 'Video Files' },
              { value: 'DOCUMENT', label: 'Documents' },
              { value: 'URL', label: 'Remote URLs' }
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'PROCESSING', label: 'Processing' },
              { value: 'QUEUED', label: 'Queued' }
            ]}
          />

          <div className="flex border border-brand-charcoal/20">
            <button
              onClick={() => setViewMode('grid')}
              className={\`p-2 \${viewMode === 'grid' ? 'bg-brand-navy text-white' : 'text-brand-taupe hover:text-brand-navy'}\`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={\`p-2 \${viewMode === 'list' ? 'bg-brand-navy text-white' : 'text-brand-taupe hover:text-brand-navy'}\`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Loading content repository..." />
      ) : contentList.length === 0 ? (
        <EmptyState
          title="No content found"
          description="Try adjusting your filters or upload new audio/video content."
          actionLabel="Upload Content"
          onAction={() => window.location.assign('/upload')}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentList.map((item) => (
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

                <Link to={\`/content/\${item.id}\`}>
                  <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy hover:text-brand-charcoal line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                </Link>

                <p className="text-xs text-brand-taupe line-clamp-2 mb-4">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-brand-charcoal/10">
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-brand-charcoal">
                  <span>{item.mediaDurationSeconds ? formatTimecode(item.mediaDurationSeconds) : 'Document'}</span>
                  <span className="text-emerald-700 font-bold">{item.processingStatus}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Link to={\`/content/\${item.id}\`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Open Workspace
                    </Button>
                  </Link>

                  <button
                    onClick={() => {
                      setRenameModalItem(item);
                      setNewTitle(item.title);
                    }}
                    className="p-2 border border-brand-charcoal/20 hover:bg-brand-sage/20 text-brand-charcoal"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 border border-brand-charcoal/20 hover:bg-red-50 text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-brand-white border border-brand-charcoal/15 divide-y divide-brand-charcoal/10">
          {contentList.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-light/60 transition-colors">
              <div className="flex items-start space-x-4">
                <Badge variant={item.contentType === 'VIDEO' ? 'blue' : 'sage'}>
                  {item.contentType}
                </Badge>
                <div>
                  <Link to={\`/content/\${item.id}\`} className="font-display text-lg uppercase text-brand-navy hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-xs text-brand-taupe mt-0.5 line-clamp-1">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-xs font-mono text-brand-charcoal">
                  {item.mediaDurationSeconds ? formatTimecode(item.mediaDurationSeconds) : 'Document'}
                </span>
                <span className="text-xs font-mono text-brand-taupe">{formatDate(item.createdAt)}</span>
                <Link to={\`/content/\${item.id}\`}>
                  <Button variant="outline" size="sm">Open</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Content Modal */}
      <Modal
        isOpen={Boolean(renameModalItem)}
        onClose={() => setRenameModalItem(null)}
        title="Rename Content"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <Input
            label="Content Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-3 pt-4 border-t border-brand-charcoal/10">
            <Button type="button" variant="ghost" onClick={() => setRenameModalItem(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Title
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`);

// 5. src/pages/user/ReportsListPage.jsx
write('src/pages/user/ReportsListPage.jsx', `
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { FileText, Download, Eye, Sparkles } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await reportService.getReports();
        setReports(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDownload = (format) => {
    alert(\`Simulating \${format} report download.\`);
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">EXPORTED INTELLIGENCE</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Generated Reports
        </h1>
        <p className="text-xs text-brand-taupe mt-1">
          Formal executive minutes, lecture summaries, and interview briefs compiled from your content.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading compiled reports..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((rep) => (
            <Card key={rep.id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="cyan">{rep.type.replace('_', ' ')}</Badge>
                  <span className="text-[11px] font-mono text-brand-taupe">{formatDate(rep.date)}</span>
                </div>

                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy mb-2">
                  {rep.title}
                </h3>
                <p className="text-xs text-brand-taupe line-clamp-2 mb-4">
                  Source: {rep.contentTitle}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {rep.sections?.map((sec, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-brand-sage/20 text-brand-charcoal px-2 py-0.5 border border-brand-sage/40">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-charcoal/10 flex items-center justify-between gap-2">
                <Link to={\`/content/\${rep.contentId}/report\`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" icon={Eye}>
                    View
                  </Button>
                </Link>

                <Button variant="secondary" size="sm" onClick={() => handleDownload('PDF')} icon={Download}>
                  PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDownload('DOCX')} icon={Download}>
                  DOCX
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
`);

// 6. src/pages/user/SettingsPage.jsx
write('src/pages/user/SettingsPage.jsx', `
import React from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { User, Shield, Bell, HardDrive, Trash2 } from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

export function SettingsPage() {
  const user = useSelector((state) => state.auth.user);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      fullName: user?.fullName || 'Rahul Sharma',
      email: user?.email || 'rahul@wrapai.io',
      timezone: user?.timezone || 'UTC+05:30 (India Standard Time)'
    }
  });

  const onSubmit = () => {
    alert('Settings updated successfully in mock state.');
  };

  const usedBytes = user?.storageUsedBytes || 1284505600;
  const limitBytes = user?.storageLimitBytes || 5368709120;
  const storagePercent = Math.round((usedBytes / limitBytes) * 100);

  return (
    <div className="max-w-4xl space-y-10">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">WORKSPACE CONFIGURATION</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Account & Settings
        </h1>
      </div>

      {/* 1. Profile Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <User className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Profile Details</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('fullName')} />
            <Input label="Email Address" type="email" disabled {...register('email')} />
          </div>

          <Select
            label="Timezone"
            {...register('timezone')}
            options={[
              { value: 'UTC+05:30 (India Standard Time)', label: 'UTC+05:30 (India Standard Time)' },
              { value: 'UTC-04:00 (Eastern Time)', label: 'UTC-04:00 (Eastern Time)' },
              { value: 'UTC+00:00 (GMT)', label: 'UTC+00:00 (GMT)' },
              { value: 'UTC+01:00 (Central European Time)', label: 'UTC+01:00 (Central European Time)' }
            ]}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm">Save Profile</Button>
          </div>
        </form>
      </Card>

      {/* 2. Storage Quota Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <HardDrive className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Storage & Quota</h2>
        </div>

        <div className="space-y-4">
          <ProgressBar progress={storagePercent} label={\`Storage Used: \${formatBytes(usedBytes)} of \${formatBytes(limitBytes)}\`} />
          <p className="text-xs text-brand-taupe">
            Large audio and video files are preserved in high-durability AWS S3 object storage. Transcripts and vectors are stored in MongoDB Atlas.
          </p>
        </div>
      </Card>

      {/* 3. Security Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <Shield className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Security & Password</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="outline" size="sm">Change Password</Button>
        </div>
      </Card>

      {/* 4. Danger Zone */}
      <Card className="p-8 border-red-300 bg-red-50/30">
        <div className="flex items-center space-x-3 pb-4 border-b border-red-200 mb-4 text-red-900">
          <Trash2 className="w-5 h-5 text-red-700" />
          <h2 className="font-display text-2xl uppercase tracking-wide">Danger Zone</h2>
        </div>
        <p className="text-xs text-red-800 mb-4">
          Permanently delete your account and all associated audio, video, transcripts, and intelligence reports. This action is irreversible.
        </p>
        <Button variant="danger" size="sm">Delete Account</Button>
      </Card>
    </div>
  );
}
`);

console.log('Part 7 user dashboard pages generated successfully.');
