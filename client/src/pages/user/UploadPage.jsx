import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { contentService } from '../../services/contentService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import {
  UploadCloud,
  Mic,
  Video,
  FileText,
  Link2,
  File,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

const LIMITS = {
  AUDIO: { maxSize: 100 * 1024 * 1024, label: '100 MB', accept: '.mp3,.wav,.m4a,.aac,.ogg,.flac' },
  VIDEO: { maxSize: 500 * 1024 * 1024, label: '500 MB', accept: '.mp4,.webm,.mov,.mkv' },
  DOCUMENT: { maxSize: 50 * 1024 * 1024, label: '50 MB', accept: '.txt,.pdf,.docx,.doc' },
  TEXT: { maxChars: 100000, label: '100,000 chars' },
  LINK: { label: 'Direct HTTPS media link' }
};

export function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'AUDIO';

  const [activeTab, setActiveTab] = useState(initialType);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const abortControllerRef = useRef(null);
  const { register, handleSubmit } = useForm();

  const tabs = [
    { id: 'AUDIO', label: 'AUDIO', icon: Mic },
    { id: 'VIDEO', label: 'VIDEO', icon: Video },
    { id: 'DOCUMENT', label: 'DOCUMENT', icon: FileText },
    { id: 'LINK', label: 'URL LINK', icon: Link2 },
    { id: 'TEXT', label: 'RAW TEXT', icon: File }
  ];

  const validateSelectedFile = (file, tab) => {
    setErrorMessage('');
    if (!file) return false;

    const limit = LIMITS[tab];
    if (limit && limit.maxSize && file.size > limit.maxSize) {
      setErrorMessage(`File exceeds maximum allowed size of ${limit.label} for ${tab}. Current file: ${formatBytes(file.size)}.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateSelectedFile(file, activeTab)) {
        setSelectedFile(file);
      } else {
        e.target.value = null;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateSelectedFile(file, activeTab)) {
        setSelectedFile(file);
      }
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage('Upload cancelled by user.');
    }
  };

  const onSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsUploading(true);
    setUploadProgress(0);

    abortControllerRef.current = new AbortController();

    try {
      let res;
      if (activeTab === 'TEXT') {
        if (!data.rawText || data.rawText.trim().length === 0) {
          setErrorMessage('Raw text content cannot be empty.');
          setIsUploading(false);
          return;
        }
        res = await contentService.submitText({
          title: data.title || 'Verbatim Discussion Notes',
          text: data.rawText,
          description: data.description || '',
          tags: data.tags
        });
      } else if (activeTab === 'LINK') {
        if (!data.url || !data.url.startsWith('http')) {
          setErrorMessage('Please enter a valid HTTP or HTTPS media URL.');
          setIsUploading(false);
          return;
        }
        res = await contentService.submitUrl({
          title: data.title || 'Linked Media Stream',
          url: data.url,
          description: data.description || '',
          tags: data.tags
        });
      } else {
        if (!selectedFile) {
          setErrorMessage('Please select a file to upload.');
          setIsUploading(false);
          return;
        }
        res = await contentService.uploadFile(
          {
            file: selectedFile,
            title: data.title || selectedFile.name,
            description: data.description || '',
            tags: data.tags
          },
          (progress) => setUploadProgress(progress),
          abortControllerRef.current.signal
        );
      }

      setUploadProgress(100);
      setSuccessMessage('Content successfully ingested into WrapAI repository! Initializing processing...');
      
      setTimeout(() => {
        if (res && res.data && res.data.id) {
          navigate(`/processing/${res.data.id}`);
        } else {
          navigate('/content');
        }
      }, 800);
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('canceled')) {
        setErrorMessage('Upload was cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to upload content. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            CONTENT INGESTION
          </span>
          <h1 className="text-poster-section text-[#141414]">
            UPLOAD & <br />
            <span className="text-[#1351AA]">INGEST.</span>
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            MULTI-MODAL AUDIO, VIDEO, DOCUMENTS & STREAMING URLS
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-[#1b6b36]/10 border border-[#1b6b36] text-[#1b6b36] text-xs font-mono flex items-center space-x-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Ingest Canvas */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="FORMAT MATRIX" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            S3 OBJECT STORAGE STREAM
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-8">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setSelectedFile(null);
              setErrorMessage('');
            }}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Zone for AUDIO, VIDEO, DOCUMENT */}
            {['AUDIO', 'VIDEO', 'DOCUMENT'].includes(activeTab) && (
              <div>
                {!selectedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-10 sm:p-14 text-center transition-colors duration-300 ${
                      dragActive ? 'border-[#1351AA] bg-[#1351AA]/5' : 'border-[#C7C7C7] bg-[#E3E2DE]/40'
                    }`}
                  >
                    <UploadCloud className="w-12 h-12 text-[#141414] mx-auto mb-4" />
                    <p className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[#141414] mb-1">
                      DRAG AND DROP YOUR {activeTab} FILE HERE
                    </p>
                    <p className="text-xs font-mono text-[#7A7A7A] mb-6">
                      MAXIMUM SIZE: {LIMITS[activeTab]?.label}
                    </p>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-6 py-3 bg-[#141414] text-[#E3E2DE] text-xs font-bold uppercase tracking-wider hover:bg-[#1351AA] transition-colors">
                        BROWSE LOCAL FILES
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept={LIMITS[activeTab]?.accept}
                      />
                    </label>
                  </div>
                ) : (
                  /* Selected File Preview */
                  <div className="p-5 bg-white border border-[#141414] flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <File className="w-6 h-6 text-[#1351AA] flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold uppercase text-[#141414]">{selectedFile.name}</p>
                        <p className="text-xs font-mono text-[#7A7A7A]">
                          {formatBytes(selectedFile.size)} | {selectedFile.type || 'RAW STREAM'}
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 text-[#7A7A7A] hover:text-[#9e1c1c] transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* URL Input */}
            {activeTab === 'LINK' && (
              <Input
                label="REMOTE MULTIMEDIA URL"
                placeholder="https://example.com/audio/meeting.mp3 or video link"
                {...register('url')}
              />
            )}

            {/* Raw Text Input */}
            {activeTab === 'TEXT' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#7A7A7A]">
                  RAW TEXT CONTENT (MAX 100,000 CHARACTERS)
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste verbatim discussion, meeting transcript, or unstructured notes..."
                  className="w-full bg-[#E3E2DE] sm:bg-white border border-[#C7C7C7] p-4 text-sm text-[#141414] focus:outline-none focus:border-[#1351AA] font-mono leading-relaxed"
                  {...register('rawText')}
                />
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-3 p-5 bg-[#E3E2DE]/50 border border-[#C7C7C7]">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-[#141414] uppercase">
                  <span>UPLOADING & STORING ASSET...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar progress={uploadProgress} />
                <div className="flex justify-end pt-2">
                  <PosterButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelUpload}
                  >
                    CANCEL UPLOAD
                  </PosterButton>
                </div>
              </div>
            )}

            {/* Common Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#C7C7C7]">
              <Input
                label="CONTENT TITLE (OPTIONAL)"
                placeholder="e.g. Q3 Engineering Architecture Sync"
                {...register('title')}
              />
              <Input
                label="TAGS (COMMA SEPARATED)"
                placeholder="Engineering, Architecture, Review"
                {...register('tags')}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <PosterButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isUploading || (!selectedFile && activeTab !== 'LINK' && activeTab !== 'TEXT')}
              >
                {isUploading ? 'INGESTING...' : 'START PROCESSING PIPELINE'}
              </PosterButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
