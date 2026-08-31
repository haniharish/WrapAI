import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-brand-white border border-brand-navy shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between pb-4 border-b border-brand-charcoal/15 mb-6">
          <h3 className="font-display text-2xl uppercase tracking-wide text-brand-navy">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-brand-taupe hover:text-brand-navy hover:bg-brand-sage/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
