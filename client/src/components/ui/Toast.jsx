import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../store/slices/uiSlice.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);
  const dispatch = useDispatch();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'info' ? Info : CheckCircle2;
        return (
          <div
            key={toast.id}
            className="flex items-start justify-between p-4 bg-brand-navy text-brand-white border border-brand-charcoal shadow-xl animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-start space-x-3">
              <Icon className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div>
                {toast.title && <p className="font-bold text-sm text-brand-white">{toast.title}</p>}
                <p className="text-xs text-brand-sage/90">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="text-brand-taupe hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
