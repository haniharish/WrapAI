import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { contentService } from '../../services/contentService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { StatusLabel } from '../../components/ui/StatusLabel.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import { formatTimecode, formatDate } from '../../utils/formatters.js';
import { ArrowRight, UploadCloud, Mic, Video, Link2, FileText } from 'lucide-react';

export function UserDashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const [contentList, setContentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await contentService.getContentList();
        setContentList(res.data || []);
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
    <div className="space-y-16">
      {/* 1. Header & Context */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
              WORKSPACE OVERVIEW • {user?.fullName || 'USER'}
            </span>
            <h1 className="text-poster-section text-[#141414]">
              YOUR <br />
              <span className="text-[#1351AA]">CONTENT.</span>
            </h1>
          </div>
          <div>
            <Link to="/upload">
              <PosterButton variant="primary" size="lg" icon={UploadCloud}>
                UPLOAD NEW CONTENT
              </PosterButton>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Typographic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard index="01" label="TOTAL INGESTED" value={totalItems} subtext="STORED MULTI-MODAL ASSETS" />
        <StatCard index="02" label="PROCESSED" value={processedItems} subtext="TRANSCRIBED & ANALYZED" />
        <StatCard index="03" label="HOURS ANALYZED" value={`${totalHours}H`} subtext="AUDIO & VIDEO RUNTIME" />
        <StatCard index="04" label="REPORTS READY" value={reportsGenerated} subtext="PDF/DOCX COMPILED" />
      </div>

      {/* 3. Ingestion Matrix */}
      <div className="grid grid-cols-12 gap-8 pt-4">
        <GridSidebarLabel label="QUICK INGEST" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            INSTANT MULTI-MODAL PIPELINE
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/upload?type=AUDIO" className="border border-[#C7C7C7] p-6 bg-white/50 hover:bg-white hover:border-[#1351AA] transition-colors block space-y-3">
              <Mic className="w-5 h-5 text-[#1351AA]" />
              <h4 className="font-bold text-base uppercase text-[#141414]">AUDIO STREAM</h4>
              <p className="text-xs text-[#444343]">MP3, WAV, M4A 16kHz speech recognition.</p>
            </Link>
            <Link to="/upload?type=VIDEO" className="border border-[#C7C7C7] p-6 bg-white/50 hover:bg-white hover:border-[#1351AA] transition-colors block space-y-3">
              <Video className="w-5 h-5 text-[#1351AA]" />
              <h4 className="font-bold text-base uppercase text-[#141414]">VIDEO RECORDING</h4>
              <p className="text-xs text-[#444343]">MP4, MOV, MKV multi-speaker processing.</p>
            </Link>
            <Link to="/upload?type=TEXT" className="border border-[#C7C7C7] p-6 bg-white/50 hover:bg-white hover:border-[#1351AA] transition-colors block space-y-3">
              <FileText className="w-5 h-5 text-[#1351AA]" />
              <h4 className="font-bold text-base uppercase text-[#141414]">DOCUMENTS</h4>
              <p className="text-xs text-[#444343]">PDF, DOCX, TXT document intelligence.</p>
            </Link>
            <Link to="/upload?type=URL" className="border border-[#C7C7C7] p-6 bg-white/50 hover:bg-white hover:border-[#1351AA] transition-colors block space-y-3">
              <Link2 className="w-5 h-5 text-[#1351AA]" />
              <h4 className="font-bold text-base uppercase text-[#141414]">REMOTE URL</h4>
              <p className="text-xs text-[#444343]">Direct streaming ingest from external links.</p>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Content Editorial List */}
      <div className="grid grid-cols-12 gap-8 pt-6">
        <GridSidebarLabel label="RECENT CONTENT" index="02">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            LATEST PROCESSED RECORDINGS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#C7C7C7]">
            <span className="font-mono text-xs font-bold text-[#7A7A7A] uppercase">RECORDINGS & DOCUMENTS</span>
            <Link to="/content" className="text-xs font-bold font-mono text-[#1351AA] hover:underline uppercase flex items-center">
              VIEW ALL CONTENT <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <LoadingState message="LOADING WORKSPACE ASSETS..." />
          ) : contentList.length === 0 ? (
            <EmptyState
              title="NO CONTENT INGESTED"
              description="Upload an audio, video, or text file to begin generating structured intelligence."
              actionLabel="UPLOAD CONTENT"
              onAction={() => window.location.assign('/upload')}
            />
          ) : (
            <div className="divide-y divide-[#C7C7C7] border-b border-[#C7C7C7]">
              {contentList.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white/50 px-3 transition-colors duration-300"
                >
                  <div className="flex items-start sm:items-center space-x-4">
                    <span className="font-mono text-sm font-bold text-[#7A7A7A] group-hover:text-[#1351AA]">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <Link to={`/content/${item.id}`}>
                        <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex items-center space-x-3 text-xs font-mono text-[#7A7A7A]">
                        <span>{item.contentType}</span>
                        <span>•</span>
                        <span>{item.mediaDurationSeconds ? formatTimecode(item.mediaDurationSeconds) : 'DOCUMENT'}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <StatusLabel status={item.processingStatus} />
                    <Link to={`/content/${item.id}`}>
                      <PosterButton variant="outline" size="sm">
                        OPEN
                      </PosterButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboardPage;
