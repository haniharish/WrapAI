import React from 'react';
import { clsx } from 'clsx';

export function SectionHeader({ title, highlightWord, subtitle, index, className = '' }) {
  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex items-center space-x-2">
        {index && (
          <span className="font-mono text-xs text-[#1351AA] font-bold">
            {index}
          </span>
        )}
      </div>
      <h2 className="text-poster-section text-[#141414]">
        {highlightWord && title.includes(highlightWord) ? (
          <>
            {title.split(highlightWord)[0]}
            <span className="text-[#1351AA]">{highlightWord}</span>
            {title.split(highlightWord)[1]}
          </>
        ) : (
          title
        )}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-[#444343] max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;
