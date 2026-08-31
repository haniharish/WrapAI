import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../store/slices/uiSlice.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useSelector((state) => state.ui.toasts);
  const dispatch = useDispatch();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'info' ? Info : CheckCircle2;
        const borderStyle =
          toast.type === 'error'
            ? 'border-[#9e1c1c]'
            : toast.type === 'info'
            ? 'border-[#1351AA]'
            : 'border-[#1b6b36]';

        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between p-4 bg-[#141414] text-[#E3E2DE] border ${borderStyle} duration-300 ease-linear select-none`}
          >
            <div className="flex items-start space-x-3">
              <Icon className="w-5 h-5 text-[#1351AA] flex-shrink-0 mt-0.5" />
              <div>
                {toast.title && (
                  <p className="font-bold text-xs uppercase tracking-wider text-[#E3E2DE]">{toast.title}</p>
                )}
                <p className="text-xs text-[#E3E2DE]/80 leading-relaxed mt-0.5">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="text-[#7A7A7A] hover:text-[#E3E2DE] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
