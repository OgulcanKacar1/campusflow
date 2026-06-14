import { Check, ClipboardList, Video, Bell, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

interface NotificationItemProps {
  notif: any;
  onRead: (id: string) => void;
  timeAgo: (dateStr: string) => string;
}

export default function NotificationItem({ notif, onRead, timeAgo }: NotificationItemProps) {
  // type'a göre ikon ve renk belirle
  let Icon = Bell;
  let colorClass = 'text-purple-400 bg-purple-400/10 border-purple-400/20';

  if (notif.type === 'task_assigned') {
    Icon = ClipboardList;
    colorClass = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  } else if (notif.type === 'task_status' || notif.title?.toLowerCase().includes('durumu')) {
    Icon = Check;
    colorClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  } else if (notif.type?.includes('meeting') || notif.title?.toLowerCase().includes('toplantı')) {
    Icon = Video;
    colorClass = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  } else if (notif.type === 'system') {
    Icon = AlertCircle;
    colorClass = 'text-rose-400 bg-rose-400/10 border-rose-400/20';
  } else if (notif.type === 'report' || notif.title?.toLowerCase().includes('rapor')) {
    Icon = FileText;
    colorClass = 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
  }

  return (
    <div
      className={`
        relative flex gap-3 p-4 border-b border-white/5 transition-colors
        hover:bg-white/[0.04] group
        ${!notif.is_read ? 'bg-purple-500/[0.02]' : 'opacity-60'}
      `}
    >
      {!notif.is_read && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
      )}
      
      {/* Sol İkon Kutusu */}
      <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border ${colorClass} shadow-sm`}>
        <Icon size={18} />
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h4 className={`text-sm font-semibold truncate ${!notif.is_read ? 'text-white' : 'text-gray-300'}`}>
            {notif.title}
          </h4>
          <span className="text-[10px] text-gray-500 whitespace-nowrap mt-0.5">
            {timeAgo(notif.created_at)}
          </span>
        </div>
        
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {notif.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          {notif.link ? (
            <Link 
              href={notif.link}
              onClick={() => onRead(notif.id)}
              className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 bg-purple-400/10 px-2 py-1 rounded-md"
            >
              Detayları Gör
            </Link>
          ) : <div />}
          
          {!notif.is_read && (
            <button
              onClick={() => onRead(notif.id)}
              className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 text-[10px] font-medium text-gray-400 hover:text-emerald-400"
            >
              <Check size={12} /> Okundu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
