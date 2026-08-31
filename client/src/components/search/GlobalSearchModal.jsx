import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collaborationService } from '../../services/collaborationService.js';
import { Search, Sparkles, Clock, FileText, ArrowRight, X } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await collaborationService.globalSearch(query.trim());
        setResults(res.data?.results || []);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (result) => {
    onClose();
    navigate(result.jumpUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-brand-white border border-brand-charcoal/20 shadow-2xl overflow-hidden divide-y divide-brand-charcoal/10 font-sans">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 space-x-3 bg-brand-light/40">
          <Search className="w-5 h-5 text-brand-taupe flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all accessible meetings, topics, and decisions..."
            className="flex-1 bg-transparent text-sm text-brand-navy placeholder-brand-taupe focus:outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-brand-taupe hover:text-brand-navy">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-brand-white border border-brand-charcoal/20 text-brand-taupe">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto divide-y divide-brand-charcoal/5 p-2">
          {isSearching ? (
            <div className="p-8 text-center text-xs text-brand-taupe font-mono flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4 animate-spin text-brand-navy" />
              <span>Scanning vector embeddings & transcripts...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-taupe font-mono">
              {query ? 'No matching discussions or topics found.' : 'Type a query to search across all meetings and transcripts.'}
            </div>
          ) : (
            results.map((r, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectResult(r)}
                className="p-3 hover:bg-brand-light cursor-pointer transition-colors group flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-display uppercase text-xs text-brand-navy font-bold">{r.contentTitle}</span>
                    <span className="font-mono text-[10px] bg-brand-navy/10 text-brand-navy px-1.5 py-0.2">
                      {r.speaker} • {r.formattedTime}
                    </span>
                    <Badge variant="cyan">{Math.round(r.relevanceScore * 100)}% match</Badge>
                  </div>
                  <p className="text-xs text-brand-charcoal leading-relaxed line-clamp-2">
                    "{r.snippet}"
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-taupe group-hover:text-brand-navy group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-brand-light/30 text-[10px] font-mono text-brand-taupe flex items-center justify-between">
          <span>WrapAI Global Semantic Vector Search</span>
          <span>Click any result to jump to that exact audio/video timestamp</span>
        </div>
      </div>
    </div>
  );
}
