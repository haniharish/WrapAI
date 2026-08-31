import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collaborationService } from '../../services/collaborationService.js';
import { Search, Sparkles, ArrowRight, X } from 'lucide-react';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-white border border-[#141414] overflow-hidden divide-y divide-[#C7C7C7] font-sans">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 space-x-3 bg-[#E3E2DE]">
          <Search className="w-5 h-5 text-[#141414] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH MEETINGS, TOPICS & DECISIONS..."
            className="flex-1 bg-transparent text-sm text-[#141414] placeholder-[#7A7A7A] focus:outline-none font-bold uppercase"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#7A7A7A] hover:text-[#141414] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-white border border-[#C7C7C7] text-[#141414]">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto divide-y divide-[#C7C7C7]">
          {isSearching ? (
            <div className="p-8 text-center text-xs text-[#141414] font-mono flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-[#1351AA] animate-ping" />
              <span>SCANNING ATLAS VECTOR EMBEDDINGS & TRANSCRIPTS...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7A7A7A] font-mono">
              {query ? 'NO MATCHING DISCUSSIONS OR TOPICS FOUND.' : 'TYPE A QUERY TO SEARCH ACROSS ALL RECORDINGS.'}
            </div>
          ) : (
            results.map((r, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectResult(r)}
                className="p-4 hover:bg-[#E3E2DE]/50 cursor-pointer transition-colors group flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase text-[#141414]">{r.contentTitle}</span>
                    <span className="font-mono text-[10px] bg-[#141414] text-[#E3E2DE] px-1.5 py-0.2">
                      {r.speaker} • {r.formattedTime}
                    </span>
                    <span className="font-mono text-[10px] text-[#1351AA] font-bold">
                      {Math.round(r.relevanceScore * 100)}% MATCH
                    </span>
                  </div>
                  <p className="text-xs text-[#444343] leading-relaxed line-clamp-2">
                    "{r.snippet}"
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A7A7A] group-hover:text-[#1351AA] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#E3E2DE]/50 text-[10px] font-mono text-[#7A7A7A] flex items-center justify-between uppercase">
          <span>WRAPAI SEMANTIC VECTOR SEARCH</span>
          <span>CLICK TO JUMP TO AUDIO/VIDEO TIMECODE</span>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
