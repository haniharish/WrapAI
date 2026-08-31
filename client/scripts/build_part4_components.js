// client/scripts/build_part4_components.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/components/ui/Button.jsx
write('src/components/ui/Button.jsx', `
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 tracking-wide select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-navy text-brand-white hover:bg-brand-charcoal active:scale-[0.98] border border-brand-navy shadow-sm',
    secondary: 'bg-brand-sage/25 text-brand-navy hover:bg-brand-sage/40 border border-brand-sage/50',
    outline: 'bg-transparent text-brand-navy border border-brand-navy/30 hover:border-brand-navy hover:bg-brand-navy/5',
    ghost: 'bg-transparent text-brand-navy hover:bg-brand-sage/20 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    luxury: 'bg-gradient-to-r from-brand-navy to-brand-charcoal text-brand-white border border-brand-charcoal hover:shadow-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs uppercase tracking-wider',
    md: 'px-5 py-2.5 text-sm uppercase tracking-wider',
    lg: 'px-7 py-3.5 text-base uppercase tracking-widest'
  };

  return (
    <button
      className={twMerge(clsx(base, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={clsx('w-4 h-4', children ? 'mr-2' : '')} />
      ) : null}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className={clsx('w-4 h-4', children ? 'ml-2' : '')} />
      )}
    </button>
  );
}
`);

// 2. src/components/ui/Card.jsx
write('src/components/ui/Card.jsx', `
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-brand-white border border-brand-charcoal/15 p-6 transition-all duration-300',
          hover && 'hover:border-brand-navy hover:shadow-lg hover:-translate-y-0.5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
`);

// 3. src/components/ui/Input.jsx
write('src/components/ui/Input.jsx', `
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(function Input(
  { label, error, helperText, className = '', id, icon: Icon, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-taupe">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full bg-brand-white border border-brand-charcoal/20 px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-taupe/70 transition-colors duration-200 focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy',
              Icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-brand-taupe">{helperText}</p>}
    </div>
  );
});
`);

// 4. src/components/ui/Select.jsx
write('src/components/ui/Select.jsx', `
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Select = forwardRef(function Select(
  { label, error, options = [], className = '', id, ...props },
  ref
) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={twMerge(
          clsx(
            'w-full bg-brand-white border border-brand-charcoal/20 px-4 py-2.5 text-sm text-brand-navy transition-colors duration-200 focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy appearance-none cursor-pointer',
            error && 'border-red-500',
            className
          )
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
});
`);

// 5. src/components/ui/Badge.jsx
write('src/components/ui/Badge.jsx', `
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-sage/30 text-brand-navy border-brand-sage',
    navy: 'bg-brand-navy text-brand-white border-brand-navy',
    cyan: 'bg-brand-cyan text-brand-navy border-cyan-300',
    blue: 'bg-brand-blue text-brand-navy border-blue-300',
    beige: 'bg-brand-beige/50 text-brand-navy border-brand-beige',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    danger: 'bg-red-50 text-red-800 border-red-300'
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
}
`);

// 6. src/components/ui/Modal.jsx
write('src/components/ui/Modal.jsx', `
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
      <div className={\`relative w-full \${maxWidth} bg-brand-white border border-brand-navy shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200\`}>
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
`);

// 7. src/components/ui/Tabs.jsx
write('src/components/ui/Tabs.jsx', `
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={twMerge('flex border-b border-brand-charcoal/20 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 whitespace-nowrap -mb-px',
              isActive
                ? 'border-brand-navy text-brand-navy bg-brand-sage/15 font-extrabold'
                : 'border-transparent text-brand-taupe hover:text-brand-navy hover:border-brand-charcoal/30'
            )}
          >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'ml-2 px-1.5 py-0.5 text-[10px] font-mono',
                  isActive ? 'bg-brand-navy text-brand-white' : 'bg-brand-sage/40 text-brand-navy'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
`);

// 8. src/components/ui/ProgressBar.jsx
write('src/components/ui/ProgressBar.jsx', `
import React from 'react';

export function ProgressBar({ progress = 0, label, showValue = true, className = '' }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className={\`w-full \${className}\`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-bold uppercase tracking-wider text-brand-charcoal">
          <span>{label}</span>
          {showValue && <span className="font-mono">{clamped}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-brand-sage/30 overflow-hidden">
        <div
          className="h-full bg-brand-navy transition-all duration-500 ease-luxury"
          style={{ width: \`\${clamped}%\` }}
        />
      </div>
    </div>
  );
}
`);

// 9. src/components/ui/Toast.jsx
write('src/components/ui/Toast.jsx', `
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
`);

// 10. src/components/common/AmbientBackground.jsx
write('src/components/common/AmbientBackground.jsx', `
import React from 'react';

export function AmbientBackground({ className = '' }) {
  return (
    <div className={\`absolute inset-0 pointer-events-none overflow-hidden \${className}\`} aria-hidden="true">
      {/* Orb 1: Sage */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-sage opacity-25 blur-[120px] animate-float" />
      {/* Orb 2: Soft Blue */}
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-brand-blue opacity-20 blur-[130px] animate-float-slow" />
      {/* Orb 3: Cyan */}
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-brand-cyan opacity-25 blur-[110px] animate-pulse-slow" />
    </div>
  );
}
`);

// 11. src/components/common/StatCard.jsx
write('src/components/common/StatCard.jsx', `
import React from 'react';
import { Card } from '../ui/Card.jsx';

export function StatCard({ label, value, subtext, icon: Icon, trend }) {
  return (
    <Card hover className="flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-taupe">{label}</p>
        {Icon && <Icon className="w-5 h-5 text-brand-navy opacity-70" />}
      </div>
      <div className="my-3">
        <p className="font-display text-4xl text-brand-navy tracking-tight">{value}</p>
      </div>
      {subtext && (
        <div className="flex items-center text-xs text-brand-charcoal">
          {trend && <span className="text-emerald-700 font-bold mr-1.5">{trend}</span>}
          <span className="text-brand-taupe">{subtext}</span>
        </div>
      )}
    </Card>
  );
}
`);

// 12. src/components/common/EmptyState.jsx
write('src/components/common/EmptyState.jsx', `
import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { AmbientBackground } from './AmbientBackground.jsx';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Nothing here yet',
  description = 'Upload your first file and let WrapAI turn it into useful insights.',
  actionLabel,
  onAction
}) {
  return (
    <div className="relative flex flex-col items-center justify-center p-12 text-center border border-dashed border-brand-charcoal/25 bg-brand-white/70">
      <AmbientBackground />
      <div className="relative z-10 w-16 h-16 bg-brand-sage/20 border border-brand-sage flex items-center justify-center text-brand-navy mb-5">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="relative z-10 font-display text-2xl uppercase tracking-wide text-brand-navy mb-2">{title}</h3>
      <p className="relative z-10 text-sm text-brand-taupe max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <div className="relative z-10">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
`);

// 13. src/components/common/LoadingState.jsx
write('src/components/common/LoadingState.jsx', `
import React from 'react';

export function LoadingState({ message = 'Loading intelligence data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 border-2 border-brand-sage/30 rounded-full" />
        <div className="absolute inset-0 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">{message}</p>
    </div>
  );
}
`);

// 14. src/components/common/ErrorState.jsx
write('src/components/common/ErrorState.jsx', `
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function ErrorState({ title = 'Error Encountered', message = 'Something went wrong while fetching data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-red-200 bg-red-50/50">
      <div className="w-12 h-12 bg-red-100 border border-red-300 flex items-center justify-center text-red-700 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-display text-2xl uppercase text-red-900 mb-2">{title}</h3>
      <p className="text-sm text-red-700 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
`);

// 15. src/components/media/MediaPlayer.jsx
write('src/components/media/MediaPlayer.jsx', `
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { seekPlayback, setIsPlaying } from '../../store/slices/workspaceSlice.js';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward } from 'lucide-react';
import { formatTimecode } from '../../utils/formatters.js';

export function MediaPlayer({ duration = 3120, title = 'Media Stream' }) {
  const dispatch = useDispatch();
  const currentSeconds = useSelector((state) => state.workspace.currentPlaybackSeconds);
  const isPlaying = useSelector((state) => state.workspace.isPlaying);

  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const togglePlay = () => {
    dispatch(setIsPlaying(!isPlaying));
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    dispatch(seekPlayback(newTime));
  };

  const speeds = [1, 1.25, 1.5, 2];
  const cycleSpeed = () => {
    const idx = speeds.indexOf(playbackSpeed);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackSpeed(next);
  };

  return (
    <div className="bg-brand-navy text-brand-white border border-brand-charcoal p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-brand-white text-brand-navy flex items-center justify-center hover:bg-brand-sage transition-colors active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div>
            <p className="text-xs font-mono text-brand-sage uppercase tracking-wider">
              {formatTimecode(currentSeconds)} / {formatTimecode(duration)}
            </p>
            <p className="text-xs text-brand-white/80 truncate max-w-xs">{title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1 text-xs font-mono border border-brand-charcoal bg-brand-charcoal/60 hover:bg-brand-charcoal text-brand-cyan transition-colors"
          >
            {playbackSpeed}x
          </button>

          <div className="flex items-center space-x-2">
            <button onClick={() => setIsMuted(!isMuted)} className="text-brand-taupe hover:text-white">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20 accent-brand-cyan h-1 bg-brand-charcoal cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Scrubber timeline */}
      <div className="relative flex items-center group">
        <input
          type="range"
          min="0"
          max={duration}
          step="1"
          value={currentSeconds}
          onChange={handleSeek}
          className="w-full accent-brand-cyan h-2 bg-brand-charcoal rounded-none cursor-pointer"
        />
      </div>
    </div>
  );
}
`);

console.log('Part 4 components generated successfully.');
