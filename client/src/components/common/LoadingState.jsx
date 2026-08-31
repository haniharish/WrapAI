import React from 'react';

export function LoadingState({ message = 'PROCESSING DATA...', progress }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center border border-[#C7C7C7] bg-white/40 my-6">
      <div className="w-48 sm:w-64 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-[#7A7A7A] uppercase tracking-[0.2em]">
          <span>SYSTEM</span>
          <span className="text-[#1351AA] animate-pulse">ACTIVE</span>
        </div>
        <div className="w-full h-1.5 bg-[#C7C7C7]/50 overflow-hidden relative">
          <div className="absolute inset-y-0 bg-[#1351AA] w-1/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#141414] pt-2">
          {message}
        </p>
      </div>
    </div>
  );
}

export default LoadingState;
