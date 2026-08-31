import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { contentService } from '../../services/contentService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import {
  UploadCloud,
  Mic,
  Video,
  FileText,
  Link2,
  File,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Ban
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
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const tabs = [
    { id: 'AUDIO', label: 'Audio', icon: Mic },
    { id: 'VIDEO', label: 'Video', icon: Video },
    { id: 'DOCUMENT', label: 'Document', icon: FileText },
    { id: 'LINK', label: 'URL Link', icon: Link2 },
    { id: 'TEXT', label: 'Raw Text', icon: File }
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
      
      // Navigate to processing status page
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">CONTENT INGESTION</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Upload & Ingest Content
        </h1>
        <p className="text-xs text-brand-taupe mt-1">
          Supported formats: Audio (MP3, WAV, M4A, AAC), Video (MP4, MOV, WebM), Documents (TXT, PDF, DOCX), or Remote URLs.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <Card className="p-8">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setSelectedFile(null);
            setErrorMessage('');
          }}
          className="mb-8"
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
                  className={`border-2 border-dashed p-12 text-center transition-all ${
                    dragActive ? 'border-brand-navy bg-brand-sage/20' : 'border-brand-charcoal/20 bg-brand-light/40'
                  }`}
                >
                  <UploadCloud className="w-12 h-12 text-brand-navy mx-auto mb-4 opacity-70" />
                  <p className="font-display text-xl uppercase text-brand-navy mb-1">
                    Drag and drop your {activeTab.toLowerCase()} file here
                  </p>
                  <p className="text-xs text-brand-taupe mb-4">
                    Maximum file size: {LIMITS[activeTab]?.label} (Direct S3 Object Storage)
                  </p>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-brand-navy text-brand-white text-xs font-bold uppercase tracking-wider hover:bg-brand-charcoal">
                      Browse Local Files
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
                <div className="p-4 bg-brand-light border border-brand-navy flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-6 h-6 text-brand-navy flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-brand-navy">{selectedFile.name}</p>
                      <p className="text-[10px] font-mono text-brand-taupe">
                        {formatBytes(selectedFile.size)} | {selectedFile.type || 'Unknown MIME'}
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-brand-taupe hover:text-red-600"
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
              label="Remote Multimedia URL"
              icon={Link2}
              placeholder="https://example.com/audio/meeting.mp3 or video link"
              {...register('url')}
            />
          )}

          {/* Raw Text Input */}
          {activeTab === 'TEXT' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                Paste Raw Text / Transcript (Max 100,000 chars)
              </label>
              <textarea
                rows={7}
                placeholder="Paste verbatim discussion, meeting transcript, or unstructured notes..."
                className="w-full bg-brand-white border border-brand-charcoal/20 p-4 text-sm text-brand-navy focus:outline-none focus:border-brand-navy font-mono"
                {...register('rawText')}
              />
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2 p-4 bg-brand-light border border-brand-charcoal/15">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-brand-navy">
                <span>Uploading & Storing Media...</span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar progress={uploadProgress} />
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Ban}
                  onClick={handleCancelUpload}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel Upload
                </Button>
              </div>
            </div>
          )}

          {/* Common Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-charcoal/10">
            <Input
              label="Content Title (Optional)"
              placeholder="e.g. Q3 Engineering Sync"
              {...register('title')}
            />
            <Input
              label="Tags (Comma separated)"
              placeholder="Engineering, Storage, Review"
              {...register('tags')}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Sparkles}
              isLoading={isUploading}
              disabled={isUploading || (!selectedFile && activeTab !== 'LINK' && activeTab !== 'TEXT')}
            >
              {isUploading ? 'Ingesting...' : 'Ingest Content'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
