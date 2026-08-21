import React from 'react';
import { Calendar, User, Info, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const ComplaintTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-charcoal-muted text-sm flex items-center gap-2 py-4">
        <Info className="w-4 h-4 text-charcoal-muted" />
        No history logs available for this complaint.
      </div>
    );
  }

  const formatDateTime = (dateStr) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy • hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const getTimelineEvent = (log) => {
    const updaterName = log.changedBy?.name || 'System';

    if (log.fromStatus === null && log.toStatus === 'OPEN') {
      return {
        title: 'Complaint Registered',
        desc: `Submitted by resident.`,
        color: 'bg-navy',
        icon: <AlertCircle className="w-4 h-4 text-white" />,
      };
    }

    if (log.toStatus === 'RESOLVED') {
      return {
        title: 'Marked as Resolved',
        desc: `Resolved by administrator: ${updaterName}`,
        color: 'bg-sage',
        icon: <CheckCircle2 className="w-4 h-4 text-white" />,
      };
    }

    if (log.toStatus && log.fromStatus && log.toStatus !== log.fromStatus) {
      return {
        title: 'Status Updated',
        desc: (
          <span className="flex items-center gap-1.5">
            Changed status from <span className="font-semibold text-charcoal-muted">{log.fromStatus}</span>
            <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
            <span className="font-semibold text-charcoal">{log.toStatus}</span>
          </span>
        ),
        color: 'bg-navy-light',
        icon: <Info className="w-4 h-4 text-navy" />,
      };
    }

    // Default action update
    return {
      title: 'Action Logged',
      desc: log.adminNote || 'Details updated by administrator.',
      color: 'bg-sand-muted',
      icon: <User className="w-4 h-4 text-charcoal" />,
    };
  };

  return (
    <div className="relative border-l-2 border-charcoal-border ml-3 pl-6 space-y-6 py-2">
      {history.map((log, index) => {
        const event = getTimelineEvent(log);
        const isManagement = log.changedBy?.role === 'ADMIN';
        
        return (
          <div key={log.id || index} className="relative group animate-fade-in">
            {/* Timeline node */}
            <span className={`absolute -left-[33px] top-1.5 flex items-center justify-center w-6.5 h-6.5 rounded-full ring-4 ring-white shadow-sm ${event.color}`}>
              {event.icon}
            </span>

            {/* Timestamps & Actor badging */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-charcoal-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-charcoal-muted" />
                {formatDateTime(log.timestamp)}
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-charcoal font-semibold">{log.changedBy?.name || 'System'}</span>
                {isManagement && (
                  <span className="px-1.5 py-0.25 text-[9px] font-bold rounded bg-navy-light text-navy border border-navy/20">
                    Updated by Management
                  </span>
                )}
              </div>
            </div>

            {/* Event Name */}
            <h4 className="text-sm font-bold text-charcoal mt-1">
              {event.title}
            </h4>

            {/* Event Description */}
            <div className="text-xs text-charcoal-muted mt-0.5">
              {event.desc}
            </div>

            {/* Speech bubble for remarks */}
            {log.adminNote && (
              <div className="relative mt-3 bg-sand-light border border-charcoal-border rounded-xl p-3.5 text-charcoal text-xs shadow-sm leading-relaxed after:absolute after:bottom-full after:left-4 after:border-8 after:border-transparent after:border-b-sand-light">
                <p className="font-semibold text-charcoal">{log.adminNote}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ComplaintTimeline;
