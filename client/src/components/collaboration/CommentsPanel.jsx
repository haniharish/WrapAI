import React, { useState, useEffect } from 'react';
import { collaborationService } from '../../services/collaborationService.js';
import { MessageSquare, Send, Reply, Trash2, Edit2, Check, X, Clock } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatDate } from '../../utils/formatters.js';

export function CommentsPanel({ contentId, currentTimestamp = 0, onSeekTimestamp }) {
  const [comments, setComments] = useState([]);
  const [newText, setNewText] = useState('');
  const [replyParentId, setReplyParentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('wrapai_user') || '{}');

  useEffect(() => {
    loadComments();
  }, [contentId]);

  async function loadComments() {
    setIsLoading(true);
    try {
      const res = await collaborationService.getComments(contentId);
      setComments(res.data || []);
    } catch (err) {
      console.warn('Failed to load comments:', err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const payload = {
        targetType: 'TRANSCRIPT',
        text: newText.trim(),
        timestampSeconds: attachTimestamp ? Math.floor(currentTimestamp) : null,
        parentCommentId: replyParentId || undefined
      };

      const res = await collaborationService.createComment(contentId, payload);
      setComments((prev) => [...prev, res.data]);
      setNewText('');
      setReplyParentId(null);
    } catch (err) {
      alert(`Failed to add comment: ${err.message}`);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await collaborationService.updateComment(commentId, editText.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId || c._id === commentId ? res.data : c))
      );
      setEditingId(null);
    } catch (err) {
      alert(`Failed to update comment: ${err.message}`);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await collaborationService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c._id !== commentId));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId) => comments.filter((c) => c.parentCommentId === parentId);

  return (
    <div className="bg-brand-white border border-brand-charcoal/15 flex flex-col h-full font-sans text-xs">
      <div className="p-3 border-b border-brand-charcoal/15 bg-brand-light/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-brand-navy" />
          <span className="font-display uppercase tracking-wider text-xs text-brand-navy">
            Collaboration & Notes ({comments.length})
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-brand-taupe font-mono">
            No notes yet. Add a timestamped comment below.
          </div>
        ) : (
          topLevelComments.map((c) => {
            const replies = getReplies(c.id || c._id);
            const isOwn = (c.userId?.id || c.userId?._id) === currentUser?.id;

            return (
              <div key={c.id || c._id} className="space-y-2 p-3 bg-brand-light/30 border border-brand-charcoal/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-brand-navy">{c.userId?.fullName || 'User'}</span>
                    {c.timestampSeconds !== null && c.timestampSeconds !== undefined && (
                      <button
                        onClick={() => onSeekTimestamp && onSeekTimestamp(c.timestampSeconds)}
                        className="font-mono text-[10px] bg-brand-navy/10 hover:bg-brand-navy/20 text-brand-navy px-1.5 py-0.2 flex items-center space-x-1"
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {Math.floor(c.timestampSeconds / 60)}:
                          {Math.floor(c.timestampSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-brand-taupe">{formatDate(c.createdAt)}</span>
                </div>

                {editingId === (c.id || c._id) ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border border-brand-charcoal/20 bg-brand-white focus:outline-none"
                      rows={2}
                    />
                    <div className="flex space-x-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={() => handleUpdate(c.id || c._id)}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-brand-charcoal leading-relaxed">{c.text}</p>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-1 border-t border-brand-charcoal/5 text-[11px] font-mono">
                  <button
                    onClick={() => setReplyParentId(c.id || c._id)}
                    className="text-brand-taupe hover:text-brand-navy flex items-center space-x-1"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(c.id || c._id);
                          setEditText(c.text);
                        }}
                        className="text-brand-taupe hover:text-brand-navy flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id || c._id)}
                        className="text-brand-taupe hover:text-rose-600 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-4 border-l-2 border-brand-charcoal/15 space-y-2 mt-2">
                    {replies.map((rep) => (
                      <div key={rep.id || rep._id} className="p-2 bg-brand-white border border-brand-charcoal/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-brand-navy text-[11px]">{rep.userId?.fullName || 'User'}</span>
                          <span className="text-[9px] font-mono text-brand-taupe">{formatDate(rep.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-brand-charcoal">{rep.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleCreateComment} className="p-3 border-t border-brand-charcoal/15 bg-brand-light/50 space-y-2">
        {replyParentId && (
          <div className="flex items-center justify-between text-[10px] font-mono text-brand-navy bg-brand-sage/20 p-1 px-2">
            <span>Replying to thread...</span>
            <button onClick={() => setReplyParentId(null)} className="font-bold">×</button>
          </div>
        )}

        <textarea
          rows={2}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Leave a note or question on this moment..."
          className="w-full p-2 border border-brand-charcoal/20 bg-brand-white focus:outline-none text-xs"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-1.5 text-[10px] font-mono text-brand-taupe cursor-pointer">
            <input
              type="checkbox"
              checked={attachTimestamp}
              onChange={(e) => setAttachTimestamp(e.target.checked)}
              className="accent-brand-navy"
            />
            <span>Attach timestamp ({Math.floor(currentTimestamp / 60)}:{Math.floor(currentTimestamp % 60).toString().padStart(2, '0')})</span>
          </label>

          <Button variant="primary" size="sm" type="submit" icon={Send}>
            Post Note
          </Button>
        </div>
      </form>
    </div>
  );
}
