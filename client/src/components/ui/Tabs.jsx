import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={twMerge('flex border-b border-[#C7C7C7] overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300 ease-linear border-b-2 whitespace-nowrap -mb-[1px]',
              isActive
                ? 'border-[#1351AA] text-[#1351AA] bg-white/60 font-black'
                : 'border-transparent text-[#7A7A7A] hover:text-[#141414] hover:border-[#C7C7C7]'
            )}
          >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'ml-2 px-1.5 py-0.5 text-[10px] font-mono font-bold',
                  isActive ? 'bg-[#1351AA] text-[#E3E2DE]' : 'bg-[#C7C7C7]/50 text-[#141414]'
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

export default Tabs;
