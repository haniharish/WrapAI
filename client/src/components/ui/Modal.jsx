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
      <div
        className="fixed inset-0 bg-[#141414]/70 backdrop-blur-xs transition-opacity duration-300 ease-linear"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} bg-[#E3E2DE] border-2 border-[#141414] p-6 sm:p-8 z-10 duration-300 ease-linear`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#C7C7C7] mb-6">
          <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#141414]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A7A7A] hover:text-[#141414] hover:bg-[#141414]/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
