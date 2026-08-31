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
