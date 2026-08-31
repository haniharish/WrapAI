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
