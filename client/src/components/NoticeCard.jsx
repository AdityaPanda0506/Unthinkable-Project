import React from 'react';
import { Calendar, User, Pin, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const NoticeCard = ({ notice, onDelete }) => {
  const { user } = useAuth();

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const isImportant = notice.isImportant === true;

  return (
    <div
      className={`
        relative overflow-hidden border rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5
        ${isImportant
          ? 'bg-white border-l-4 border-l-navy border-y-charcoal-border border-r-charcoal-border shadow-md'
          : 'bg-white border-charcoal-border'
        }
      `}
    >
      {/* Important Notice Badge */}
      {isImportant && (
        <div className="flex items-center gap-1 text-[9px] font-extrabold text-navy uppercase tracking-widest mb-3.5 select-none animate-pulse-slow">
          <Pin className="w-3 h-3 fill-navy text-navy" />
          <span>Important Notice</span>
        </div>
      )}

      <div className="flex justify-between items-start gap-4">
        {/* Title */}
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-charcoal tracking-tight leading-snug">
            {notice.title}
          </h3>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-muted mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-charcoal-muted" />
              {formatDate(notice.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-charcoal-muted" />
              By {notice.author?.name || 'Management'}
            </span>
          </div>
        </div>

        {/* Delete button (Admin only) */}
        {user?.role === 'ADMIN' && onDelete && (
          <button
            onClick={() => onDelete(notice.id)}
            className="p-2 text-charcoal-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300"
            title="Delete Announcement"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Announcement Content */}
      <p className="text-charcoal text-sm mt-4.5 leading-relaxed whitespace-pre-line">
        {notice.content}
      </p>
    </div>
  );
};

export default NoticeCard;
