import React from 'react';

const PriorityBadge = ({ priority }) => {
  const getPriorityStyles = () => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'LOW':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityStyles()}`}>
      {priority || 'MEDIUM'}
    </span>
  );
};

export default PriorityBadge;
