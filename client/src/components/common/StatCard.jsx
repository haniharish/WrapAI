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
