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
    navigate(`/processing/${res.data.id}`);
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
                  className={`border-2 border-dashed p-12 text-center transition-all ${
                    dragActive ? 'border-brand-navy bg-brand-sage/20' : 'border-brand-charcoal/20 bg-brand-light/40'
                  }`}
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
