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
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
      <div 
        className="grid bg-black/20 border-b border-white/5 flex-shrink-0"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toString()} className={`p-4 text-center border-r border-white/5 ${isToday ? 'bg-white/5' : ''}`}>
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                {format(day, 'EEEE', { locale: tr })}
              </div>
              <div className={`text-2xl font-bold ${isToday ? 'text-[#6366f1]' : 'text-white/90'}`}>
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
            <div key={day.toString()} className={`p-3 border-r border-white/5 ${isToday ? 'bg-white/[0.02]' : ''}`}>
              <div className="space-y-3">
                {dayEvents.map(event => {
                  let bgColor = 'rgba(249, 115, 22, 0.1)'; // orange
                  let borderColor = 'rgba(249, 115, 22, 0.2)';
                  let dotColor = '#fb923c';
                  let textColor = '#fdba74';
                  
                  if (event.type === 'meeting') {
                    bgColor = 'rgba(59, 130, 246, 0.2)';
                    borderColor = 'rgba(59, 130, 246, 0.3)';
                    dotColor = '#60a5fa';
                    textColor = '#93c5fd';
                  } else if (event.type === 'task') {
                    const isSelfAssigned = event.originalData?.assigned_to === currentUserId || 
                      event.originalData?.task_members?.some((m: any) => m.student_id === currentUserId);
                      
                    if (isSelfAssigned) {
                      bgColor = 'rgba(139, 92, 246, 0.2)';
                      borderColor = 'rgba(139, 92, 246, 0.3)';
                      dotColor = '#a78bfa';
                      textColor = '#c4b5fd';
                    } else {
                      bgColor = 'rgba(34, 197, 94, 0.2)';
                      borderColor = 'rgba(34, 197, 94, 0.3)';
                      dotColor = '#4ade80';
                      textColor = '#86efac';
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
                       <span className="text-xs font-medium text-white/60">
                         {format(new Date(event.start), 'HH:mm')}
                       </span>
                    </div>
                    <div className="font-semibold text-white/90 text-sm leading-tight mb-1">
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-xs text-white/50 line-clamp-2">
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
