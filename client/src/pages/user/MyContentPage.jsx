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
              className={`p-2 ${viewMode === 'grid' ? 'bg-brand-navy text-white' : 'text-brand-taupe hover:text-brand-navy'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-brand-navy text-white' : 'text-brand-taupe hover:text-brand-navy'}`}
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

                <Link to={`/content/${item.id}`}>
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
                  <Link to={`/content/${item.id}`} className="flex-1">
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
                  <Link to={`/content/${item.id}`} className="font-display text-lg uppercase text-brand-navy hover:underline">
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
                <Link to={`/content/${item.id}`}>
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
