// client/scripts/build_part8_workspace.js
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

// 1. src/pages/user/workspace/ContentWorkspaceLayout.jsx
write('src/pages/user/workspace/ContentWorkspaceLayout.jsx', `
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
    navigate(\`/content/\${id}/\${tabId}\`);
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
`);

// 2. src/pages/user/workspace/tabs/TranscriptTab.jsx
write('src/pages/user/workspace/tabs/TranscriptTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { transcriptService } from '../../../../services/transcriptService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Input } from '../../../../components/ui/Input.jsx';
import { Select } from '../../../../components/ui/Select.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { Modal } from '../../../../components/ui/Modal.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Search, UserCheck, Edit2, Play, Copy, Check } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function TranscriptTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentSeconds = useSelector((state) => state.workspace.currentPlaybackSeconds);

  const [transcript, setTranscript] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState('ALL');
  const [renameSpeaker, setRenameSpeaker] = useState(null);
  const [newName, setNewName] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const loadTranscript = async () => {
    setIsLoading(true);
    try {
      const res = await transcriptService.getTranscript(id);
      setTranscript(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTranscript();
  }, [id]);

  const handleSpeakerRename = async (e) => {
    e.preventDefault();
    if (!renameSpeaker || !newName.trim()) return;
    await transcriptService.updateSpeakerName(id, renameSpeaker.id, newName);
    setRenameSpeaker(null);
    loadTranscript();
  };

  const handleCopy = (segId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(segId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <LoadingState message="Loading timestamped transcript..." />;

  const filteredSegments = (transcript?.segments || []).filter((seg) => {
    const matchesSearch = seg.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpeaker = speakerFilter === 'ALL' || seg.speakerId === speakerFilter;
    return matchesSearch && matchesSpeaker;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Speaker Manifest Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <div className="w-full md:w-80">
            <Input
              icon={Search}
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Select
              value={speakerFilter}
              onChange={(e) => setSpeakerFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Speakers' },
                ...(transcript?.speakers || []).map((s) => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>
        </div>

        {/* Detected Speakers Badges with Rename Action */}
        <div className="pt-3 border-t border-brand-charcoal/10 flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase text-brand-taupe">IDENTIFIED SPEAKERS:</span>
          {transcript?.speakers?.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center space-x-2 bg-brand-light border border-brand-charcoal/20 px-3 py-1 text-xs"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-bold text-brand-navy">{s.name}</span>
              <span className="text-[10px] font-mono text-brand-taupe">({s.segmentCount} turns)</span>
              <button
                onClick={() => {
                  setRenameSpeaker(s);
                  setNewName(s.name);
                }}
                className="text-brand-taupe hover:text-brand-navy ml-1"
                title="Rename Speaker"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Transcript Stream */}
      <div className="space-y-3">
        {filteredSegments.map((seg) => {
          const isActive = currentSeconds >= seg.startTime && currentSeconds <= seg.endTime;
          return (
            <div
              key={seg.id}
              className={\`p-4 sm:p-5 border transition-all duration-200 \${
                isActive
                  ? 'bg-brand-sage/20 border-brand-navy shadow-md translate-x-1'
                  : 'bg-brand-white border-brand-charcoal/15 hover:border-brand-charcoal/40'
              }\`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => dispatch(seekPlayback(seg.startTime))}
                    className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2 py-0.5"
                    title="Jump audio to this timestamp"
                  >
                    <Play className="w-2.5 h-2.5 mr-1" />
                    {formatTimecode(seg.startTime)}
                  </button>
                  <span className="font-display text-sm uppercase tracking-wide text-brand-navy">
                    {seg.speakerName}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(seg.id, seg.text)}
                  className="text-brand-taupe hover:text-brand-navy p-1"
                  title="Copy segment text"
                >
                  {copiedId === seg.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-sm text-brand-navy leading-relaxed font-sans">{seg.text}</p>
            </div>
          );
        })}
      </div>

      {/* Rename Speaker Modal */}
      <Modal
        isOpen={Boolean(renameSpeaker)}
        onClose={() => setRenameSpeaker(null)}
        title="Rename Speaker"
      >
        <form onSubmit={handleSpeakerRename} className="space-y-4">
          <p className="text-xs text-brand-taupe">
            Renaming <strong className="text-brand-navy">{renameSpeaker?.name}</strong> will update all associated transcript segments, action items, and compiled reports automatically.
          </p>
          <Input
            label="Speaker Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
          />
          <div className="flex justify-end space-x-3 pt-4 border-t border-brand-charcoal/10">
            <Button type="button" variant="ghost" onClick={() => setRenameSpeaker(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Speaker
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`);

// 3. src/pages/user/workspace/tabs/SummaryTab.jsx
write('src/pages/user/workspace/tabs/SummaryTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export function SummaryTab() {
  const { id } = useParams();
  const [intel, setIntel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setIntel(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting summary insights..." />;

  const summary = intel?.summary;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Main Takeaway Callout */}
      <Card className="bg-brand-navy text-brand-white p-6 sm:p-8 border border-brand-charcoal">
        <div className="flex items-center space-x-2 text-brand-cyan mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-[11px] font-mono uppercase font-bold tracking-widest">CORE TAKEAWAY</span>
        </div>
        <p className="text-base sm:text-lg font-medium text-brand-light leading-relaxed">
          {summary?.takeaway}
        </p>
      </Card>

      {/* 2. Executive Summary */}
      <Card className="p-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-brand-navy" /> Executive Summary
        </h2>
        <p className="text-sm text-brand-charcoal leading-relaxed">
          {summary?.executive}
        </p>
      </Card>

      {/* 3. Detailed Summary */}
      <Card className="p-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy mb-4">
          Detailed Chronological Breakdown
        </h2>
        <p className="text-sm text-brand-charcoal leading-relaxed whitespace-pre-line">
          {summary?.detailed}
        </p>
      </Card>
    </div>
  );
}
`);

// 4. src/pages/user/workspace/tabs/TopicsTab.jsx
write('src/pages/user/workspace/tabs/TopicsTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback, setActiveTab } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Hash, Play } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function TopicsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setTopics(res.data?.topics || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Identifying thematic topics..." />;

  const handleJump = (seconds) => {
    dispatch(seekPlayback(seconds));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((t) => (
          <Card key={t.id} hover className="flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-2xl text-brand-sage">{t.number}</span>
                <button
                  onClick={() => handleJump(t.timestamp)}
                  className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {formatTimecode(t.timestamp)}
                </button>
              </div>

              <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy mb-2">
                {t.title}
              </h3>
              <p className="text-xs text-brand-charcoal leading-relaxed mb-4">
                {t.description}
              </p>
            </div>

            <div className="pt-3 border-t border-brand-charcoal/10 flex items-center justify-between text-xs font-mono text-brand-taupe">
              <span>{t.segmentCount} transcript segments</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`);

// 5. src/pages/user/workspace/tabs/KeyPointsTab.jsx
write('src/pages/user/workspace/tabs/KeyPointsTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { ListOrdered, Play, CheckCircle } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function KeyPointsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setPoints(res.data?.keyPoints || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting key points..." />;

  return (
    <div className="space-y-4 max-w-5xl">
      {points.map((kp) => (
        <Card key={kp.id} hover className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-navy">{kp.statement}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-brand-taupe font-medium">Attributed to: {kp.speaker}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <Badge variant={kp.importance === 'HIGH' ? 'cyan' : 'default'}>
              {kp.importance}
            </Badge>
            <button
              onClick={() => dispatch(seekPlayback(kp.timestamp))}
              className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {formatTimecode(kp.timestamp)}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
`);

// 6. src/pages/user/workspace/tabs/HighlightsTab.jsx
write('src/pages/user/workspace/tabs/HighlightsTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Sparkles, Play } from 'lucide-react';

export function HighlightsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setHighlights(res.data?.highlights || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting important moments..." />;

  return (
    <div className="space-y-4 max-w-5xl">
      {highlights.map((hl) => (
        <Card key={hl.id} hover className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
              {hl.title}
            </h3>
            <button
              onClick={() => dispatch(seekPlayback(hl.timestamp))}
              className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {hl.timecode}
            </button>
          </div>
          <p className="text-xs text-brand-charcoal leading-relaxed">{hl.description}</p>
        </Card>
      ))}
    </div>
  );
}
`);

// 7. src/pages/user/workspace/tabs/DecisionsTab.jsx
write('src/pages/user/workspace/tabs/DecisionsTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckCircle2, Play, Users } from 'lucide-react';

export function DecisionsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [decisions, setDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setDecisions(res.data?.decisions || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) return <LoadingState message="Extracting decisions registry..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {decisions.map((dec) => (
        <Card key={dec.id} hover className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-xl uppercase tracking-wide text-brand-navy">
                  {dec.decision}
                </h3>
              </div>
            </div>
            <button
              onClick={() => dispatch(seekPlayback(dec.timestamp))}
              className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {dec.timecode}
            </button>
          </div>

          <p className="text-xs text-brand-charcoal pl-8 mb-4">{dec.context}</p>

          <div className="pl-8 pt-3 border-t border-brand-charcoal/10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-brand-taupe uppercase font-bold">AGREED BY:</span>
            {dec.participants?.map((p, idx) => (
              <Badge key={idx} variant="default" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
`);

// 8. src/pages/user/workspace/tabs/ActionItemsTab.jsx
write('src/pages/user/workspace/tabs/ActionItemsTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Badge } from '../../../../components/ui/Badge.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { CheckSquare, Play, Calendar, User } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function ActionItemsTab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setItems(res.data?.actionItems || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleStatus = async (actId, currentStatus) => {
    const nextStatus =
      currentStatus === 'Pending' ? 'In Progress' : currentStatus === 'In Progress' ? 'Completed' : 'Pending';
    const res = await intelligenceService.updateActionItemStatus(id, actId, nextStatus);
    setItems(res.data);
  };

  if (isLoading) return <LoadingState message="Extracting action items..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-brand-white border border-brand-charcoal/15 divide-y divide-brand-charcoal/10">
        {items.map((act) => (
          <div key={act.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <CheckSquare className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-brand-navy">{act.task}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-brand-taupe">
                  <span className="flex items-center text-brand-charcoal">
                    <User className="w-3.5 h-3.5 mr-1 text-brand-taupe" /> {act.owner}
                  </span>
                  <span className="flex items-center text-brand-charcoal">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-brand-taupe" /> Due: {act.deadline}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end md:self-center">
              <button
                onClick={() => toggleStatus(act.id, act.status)}
                className="cursor-pointer"
                title="Click to toggle status"
              >
                <Badge
                  variant={
                    act.status === 'Completed'
                      ? 'success'
                      : act.status === 'In Progress'
                      ? 'cyan'
                      : 'warning'
                  }
                >
                  {act.status}
                </Badge>
              </button>

              <button
                onClick={() => dispatch(seekPlayback(act.timestamp))}
                className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2.5 py-1"
              >
                <Play className="w-3 h-3 mr-1" />
                {act.timecode}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`);

// 9. src/pages/user/workspace/tabs/ReportTab.jsx
write('src/pages/user/workspace/tabs/ReportTab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { reportService } from '../../../../services/reportService.js';
import { intelligenceService } from '../../../../services/intelligenceService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { Download, RefreshCw, FileCheck, Share2 } from 'lucide-react';
import { formatDate } from '../../../../utils/formatters.js';

export function ReportTab() {
  const { id } = useParams();
  const { content } = useOutletContext();
  const [intel, setIntel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await intelligenceService.getIntelligence(id);
        setIntel(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleExport = (format) => {
    alert(\`Exporting \${format} report for \${content?.title}\`);
  };

  if (isLoading) return <LoadingState message="Compiling executive report..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-white border border-brand-charcoal/15">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-emerald-700" />
          <span className="font-display text-lg uppercase text-brand-navy">Formal Minutes Compiled</span>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} icon={Download}>
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('DOCX')} icon={Download}>
            Download DOCX
          </Button>
          <Button variant="secondary" size="sm" icon={RefreshCw}>
            Regenerate
          </Button>
        </div>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-brand-white border border-brand-charcoal/20 p-8 sm:p-12 shadow-md font-sans text-brand-navy space-y-8">
        <div className="border-b border-brand-charcoal/20 pb-6 text-center">
          <span className="font-display text-4xl uppercase tracking-wider">{content?.title}</span>
          <p className="text-xs font-mono text-brand-taupe mt-2">
            DOCUMENT GENERATED: {formatDate(content?.createdAt)} | WRAPAI INTELLIGENCE SUITE
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase tracking-wide border-b border-brand-charcoal/15 pb-2 mb-3">
            1. Executive Summary
          </h3>
          <p className="text-xs text-brand-charcoal leading-relaxed">{intel?.summary?.executive}</p>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase tracking-wide border-b border-brand-charcoal/15 pb-2 mb-3">
            2. Major Decisions Made
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-xs text-brand-charcoal">
            {intel?.decisions?.map((d) => (
              <li key={d.id}>
                <strong>{d.decision}</strong> ({d.timecode})
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase tracking-wide border-b border-brand-charcoal/15 pb-2 mb-3">
            3. Action Item Registry
          </h3>
          <table className="w-full text-xs text-left border border-brand-charcoal/20 mt-2">
            <thead className="bg-brand-light border-b border-brand-charcoal/20 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-2.5">Task</th>
                <th className="p-2.5">Owner</th>
                <th className="p-2.5">Deadline</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-charcoal/10">
              {intel?.actionItems?.map((a) => (
                <tr key={a.id}>
                  <td className="p-2.5 font-bold">{a.task}</td>
                  <td className="p-2.5 font-mono">{a.owner}</td>
                  <td className="p-2.5 font-mono">{a.deadline}</td>
                  <td className="p-2.5 font-mono">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`);

// 10. src/pages/user/workspace/tabs/AskAITab.jsx
write('src/pages/user/workspace/tabs/AskAITab.jsx', `
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { seekPlayback } from '../../../../store/slices/workspaceSlice.js';
import { chatService } from '../../../../services/chatService.js';
import { Card } from '../../../../components/ui/Card.jsx';
import { Input } from '../../../../components/ui/Input.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { LoadingState } from '../../../../components/common/LoadingState.jsx';
import { MessageSquare, Send, Play, Sparkles, User } from 'lucide-react';
import { formatTimecode } from '../../../../utils/formatters.js';

export function AskAITab() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await chatService.getChatHistory(id);
        setMessages(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isSending) return;
    const text = inputVal;
    setInputVal('');
    setIsSending(true);

    try {
      const res = await chatService.askQuestion(id, text);
      const history = await chatService.getChatHistory(id);
      setMessages(history.data);
    } finally {
      setIsSending(false);
    }
  };

  const handlePromptClick = (question) => {
    setInputVal(question);
  };

  if (isLoading) return <LoadingState message="Initializing RAG chat interface..." />;

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center space-x-2 pb-4 border-b border-brand-charcoal/10 mb-6">
          <MessageSquare className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Ask Your Content</h2>
        </div>

        {/* Example prompts */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-xs font-mono font-bold text-brand-taupe uppercase py-1">SUGGESTIONS:</span>
          {[
            'What decisions were made?',
            'What did Rahul say about the database?',
            'When was the deployment deadline discussed?',
            'Summarize all engineering action items'
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(q)}
              className="text-xs bg-brand-light hover:bg-brand-sage/20 border border-brand-charcoal/20 px-3 py-1 text-brand-charcoal transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="space-y-6 min-h-[300px] mb-6">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start space-x-3">
              <div
                className={\`w-8 h-8 flex items-center justify-center font-bold text-xs \${
                  m.sender === 'USER' ? 'bg-brand-navy text-brand-white' : 'bg-brand-sage text-brand-navy'
                }\`}
              >
                {m.sender === 'USER' ? 'YOU' : 'AI'}
              </div>

              <div className="bg-brand-light border border-brand-charcoal/15 p-4 flex-1">
                <p className="text-sm text-brand-navy leading-relaxed">{m.message}</p>

                {/* Grounded Citation Badges */}
                {m.citations?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-charcoal/10 space-y-2">
                    <p className="text-[10px] font-mono uppercase text-brand-taupe font-bold">VERIFIED SOURCES:</p>
                    {m.citations.map((cit, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-brand-white border border-brand-charcoal/15 p-2 text-xs flex items-center justify-between"
                      >
                        <div className="truncate mr-3">
                          <span className="font-bold text-brand-navy mr-2">{cit.speaker}:</span>
                          <span className="text-brand-charcoal italic truncate">"{cit.excerpt}"</span>
                        </div>
                        <button
                          onClick={() => dispatch(seekPlayback(cit.timestamp))}
                          className="inline-flex items-center text-xs font-mono font-bold text-brand-navy hover:text-brand-charcoal bg-brand-sage/40 hover:bg-brand-sage px-2 py-0.5 flex-shrink-0"
                        >
                          <Play className="w-2.5 h-2.5 mr-1" />
                          {cit.timecode || formatTimecode(cit.timestamp)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center space-x-3 p-4 bg-brand-sage/15 border border-brand-sage text-xs font-mono text-brand-charcoal">
              <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
              <span>Searching Atlas Vector Store & formulating grounded response...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-brand-charcoal/15">
          <Input
            placeholder="Ask anything about this uploaded content..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <Button type="submit" variant="primary" size="md" icon={Send} disabled={isSending || !inputVal.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
`);

console.log('Part 8 workspace layout and tabs generated successfully.');
