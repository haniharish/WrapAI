import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentService } from '../../services/contentService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { StatusLabel } from '../../components/ui/StatusLabel.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import {
  Search,
  UploadCloud,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatTimecode, formatDate, formatBytes } from '../../utils/formatters.js';

export function MyContentPage() {
  const [contentList, setContentList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Rename modal state
  const [renameModalItem, setRenameModalItem] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const loadData = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await contentService.getContentList({
        page,
        limit: pagination.limit,
        search,
        type: typeFilter,
        status: statusFilter
      });
      setContentList(res.data || []);
      if (res.meta) {
        setPagination(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [search, typeFilter, statusFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content item? Stored object storage binaries will be released.')) {
      try {
        await contentService.deleteContent(id);
        loadData(pagination.page);
      } catch (err) {
        alert(err.message || 'Failed to delete content');
      }
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameModalItem || !newTitle.trim()) return;
    setIsRenaming(true);
    try {
      await contentService.updateContent(renameModalItem.id, { title: newTitle.trim() });
      setRenameModalItem(null);
      loadData(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to rename content');
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
              LIBRARY REPOSITORY
            </span>
            <h1 className="text-poster-section text-[#141414]">
              CONTENT <br />
              <span className="text-[#1351AA]">LIBRARY.</span>
            </h1>
          </div>
          <div>
            <Link to="/upload">
              <PosterButton variant="primary" size="lg" icon={UploadCloud}>
                UPLOAD CONTENT
              </PosterButton>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Technical Filters & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white/70 p-4 sm:p-6 border border-[#C7C7C7]">
        <div className="md:col-span-6">
          <Input
            icon={Search}
            placeholder="SEARCH BY TITLE OR FILENAME..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'ALL MEDIA TYPES' },
              { value: 'AUDIO', label: 'AUDIO FILES' },
              { value: 'VIDEO', label: 'VIDEO FILES' },
              { value: 'DOCUMENT', label: 'DOCUMENTS' },
              { value: 'TEXT', label: 'RAW TEXT' },
              { value: 'URL', label: 'REMOTE URLS' }
            ]}
          />
        </div>

        <div className="md:col-span-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'ALL STATUSES' },
              { value: 'UPLOADED', label: 'UPLOADED (READY)' },
              { value: 'QUEUED', label: 'QUEUED' },
              { value: 'PROCESSING', label: 'PROCESSING' },
              { value: 'COMPLETED', label: 'COMPLETED' }
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Numbered Content List */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="ASSET LIST" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            PAGINATED REGISTRY ({pagination.total} TOTAL)
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          {isLoading ? (
            <LoadingState message="LOADING CONTENT REPOSITORY..." />
          ) : contentList.length === 0 ? (
            <EmptyState
              title="NO CONTENT MATCHES CRITERIA"
              description="Try adjusting your filter terms or upload new recordings."
              actionLabel="UPLOAD NEW ASSET"
              onAction={() => window.location.assign('/upload')}
            />
          ) : (
            <div className="divide-y divide-[#C7C7C7] border-y border-[#C7C7C7]">
              {contentList.map((item, idx) => (
                <div
                  key={item.id}
                  className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/60 px-4 transition-colors duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <span className="font-mono text-sm font-bold text-[#7A7A7A] group-hover:text-[#1351AA]">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <div className="space-y-1.5">
                      <Link to={`/content/${item.id}`}>
                        <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414] group-hover:text-[#1351AA] transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#7A7A7A]">
                        <span className="font-bold text-[#141414]">{item.contentType}</span>
                        <span>•</span>
                        <span>
                          {item.fileSizeBytes
                            ? formatBytes(item.fileSizeBytes)
                            : item.mediaDurationSeconds
                            ? formatTimecode(item.mediaDurationSeconds)
                            : 'TEXT'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    <StatusLabel status={item.processingStatus} />
                    <Link to={`/content/${item.id}`}>
                      <PosterButton variant="primary" size="sm">
                        OPEN
                      </PosterButton>
                    </Link>
                    <button
                      onClick={() => {
                        setRenameModalItem(item);
                        setNewTitle(item.title);
                      }}
                      className="p-2 border border-[#C7C7C7] hover:border-[#141414] text-[#141414] transition-colors cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 border border-[#C7C7C7] hover:border-[#9e1c1c] hover:text-[#9e1c1c] text-[#7A7A7A] transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#C7C7C7]">
              <span className="text-xs font-mono text-[#7A7A7A] uppercase">
                PAGE {pagination.page} OF {pagination.totalPages} ({pagination.total} TOTAL)
              </span>
              <div className="flex items-center space-x-2">
                <PosterButton
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1)}
                >
                  PREV
                </PosterButton>
                <PosterButton
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1)}
                >
                  NEXT
                </PosterButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rename Content Modal */}
      <Modal
        isOpen={Boolean(renameModalItem)}
        onClose={() => setRenameModalItem(null)}
        title="RENAME CONTENT"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-6">
          <Input
            label="CONTENT TITLE"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#C7C7C7]">
            <PosterButton type="button" variant="outline" size="sm" onClick={() => setRenameModalItem(null)}>
              CANCEL
            </PosterButton>
            <PosterButton type="submit" variant="primary" size="sm" disabled={isRenaming}>
              {isRenaming ? 'SAVING...' : 'SAVE TITLE'}
            </PosterButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MyContentPage;
