import React from 'react';
import { Circle, Clock, Check } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return {
          pill: 'bg-navy-light text-navy border-navy/20',
          icon: <Circle className="w-3 h-3 fill-navy" />,
          label: 'Open',
        };
      case 'IN_PROGRESS':
        return {
          pill: 'bg-sand text-charcoal border-sand-muted animate-pulse-slow',
          icon: <Clock className="w-3 h-3 text-charcoal" />,
          label: 'In Progress',
        };
      case 'RESOLVED':
        return {
          pill: 'bg-sage-light text-sage border-sage/30',
          icon: <Check className="w-3 h-3 text-sage stroke-[3]" />,
          label: 'Resolved',
        };
      default:
        return {
          pill: 'bg-sand text-charcoal border-sand-muted',
          icon: <Circle className="w-3 h-3" />,
          label: status || 'Unknown',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles.pill}`}>
      {styles.icon}
      {styles.label}
    </span>
  );
};

export default StatusBadge;
