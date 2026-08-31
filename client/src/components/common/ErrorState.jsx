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
