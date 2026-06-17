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
  let colorClass = 'text-primary bg-primary/10 border-primary/20';

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
    colorClass = 'text-primary bg-primary/10 border-primary/20';
  }

  return (
    <div
      className={`
        relative flex gap-3 p-4 border-b border-border/40 transition-all duration-200
        hover:bg-card/40 group
        ${!notif.is_read ? 'bg-primary/5' : 'opacity-70'}
      `}
    >
      {!notif.is_read && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(255,107,0,0.6)]" />
      )}
      
      {/* Sol İkon Kutusu */}
      <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border ${colorClass} shadow-sm`}>
        <Icon size={18} />
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h4 className={`text-sm font-bold truncate drop-shadow-sm ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {notif.title}
          </h4>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap mt-0.5">
            {timeAgo(notif.created_at)}
          </span>
        </div>
        
        <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${!notif.is_read ? 'text-muted-foreground font-medium' : 'text-muted-foreground'}`}>
          {notif.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          {notif.link ? (
            <Link 
              href={notif.link}
              onClick={() => onRead(notif.id)}
              className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md ring-1 ring-primary/20 shadow-sm shadow-primary/5"
            >
              Detayları Gör
            </Link>
          ) : <div />}
          
          {!notif.is_read && (
            <button
              onClick={() => onRead(notif.id)}
              className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-emerald-500/10 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-emerald-400"
            >
              <Check size={12} /> Okundu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
