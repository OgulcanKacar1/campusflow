import React from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarEvent } from '@/types/kanban';

interface WeekGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  currentUserId?: string;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ currentDate, events, onEventClick, currentUserId }) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Basitlik için saatlik grid yerine sadece haftanın günleri ve o günün tüm eventlerini alt alta listeleyen bir görünüm (MVP)
  // Gerçek bir TimeGrid çok karmaşıktır, CampusFlow için gün bazlı liste yeterli ve şıktır.
  
  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(new Date(e.start), day));
  };

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/20 flex flex-col min-h-[600px]">
      <div 
        className="grid bg-background/40 border-b border-border/40 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toString()} className={`p-4 text-center border-r border-border/40 ${isToday ? 'bg-background/20' : ''}`}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {format(day, 'EEEE', { locale: tr })}
              </div>
              <div className={`text-2xl font-bold ${isToday ? 'text-[#ea580c]' : 'text-foreground'}`}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
      
      <div 
        className="grid flex-1"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toString()} className={`p-3 border-r border-border/40 transition-colors hover:bg-white/5 ${isToday ? 'bg-card/20' : ''}`}>
              <div className="space-y-3">
                {dayEvents.map(event => {
                  let bgColor = 'rgba(234, 88, 12, 0.1)'; // orange for sprint
                  let borderColor = 'rgba(234, 88, 12, 0.2)';
                  let dotColor = '#ea580c';
                  let textColor = '#fb923c';
                  
                  if (event.type === 'meeting') {
                    bgColor = 'rgba(59, 130, 246, 0.1)'; // blue
                    borderColor = 'rgba(59, 130, 246, 0.2)';
                    dotColor = '#3b82f6';
                    textColor = '#60a5fa';
                  } else if (event.type === 'task') {
                    const isSelfAssigned = event.originalData?.assigned_to === currentUserId || 
                      event.originalData?.task_members?.some((m: any) => m.student_id === currentUserId);
                      
                    if (isSelfAssigned) {
                      bgColor = 'rgba(139, 92, 246, 0.1)'; // purple
                      borderColor = 'rgba(139, 92, 246, 0.2)';
                      dotColor = '#8b5cf6';
                      textColor = '#a78bfa';
                    } else {
                      bgColor = 'rgba(34, 197, 94, 0.1)'; // green
                      borderColor = 'rgba(34, 197, 94, 0.2)';
                      dotColor = '#22c55e';
                      textColor = '#4ade80';
                    }
                  }

                  return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick && onEventClick(event)}
                    className="p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                    style={{ backgroundColor: bgColor, borderColor: borderColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = dotColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                       <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                       <span className="text-xs font-medium text-muted-foreground">
                         {format(new Date(event.start), 'HH:mm')}
                       </span>
                    </div>
                    <div className="font-semibold text-foreground text-sm leading-tight mb-1">
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
