import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarEvent } from '@/types/kanban';

interface MonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  currentUserId?: string;
}

export const MonthGrid: React.FC<MonthGridProps> = ({ currentDate, events, onEventClick, currentUserId }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Pazartesiden başlayan hafta (weekStartsOn: 1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(new Date(e.start), day));
  };

  return (
    <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/20">
      <div 
        className="grid bg-background/40 border-b border-border/40" 
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div 
        className="grid auto-rows-[120px]"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div
              key={day.toString()}
              className={`p-2 border-b border-r border-border/40 transition-colors hover:bg-white/5 ${
                !isCurrentMonth ? 'opacity-30 bg-background/20' : ''
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'text-white shadow-sm' : 'text-muted-foreground'
                  }`}
                  style={isToday ? { backgroundColor: '#ea580c' } : {}}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[70px] pr-1 custom-scrollbar">
                {dayEvents.map(event => {
                  let bgColor = 'rgba(234, 88, 12, 0.1)'; // orange for sprint
                  let borderColor = 'rgba(234, 88, 12, 0.2)';
                  let textColor = '#fb923c';
                  let dotColor = '#ea580c';
                  
                  if (event.type === 'meeting') {
                    bgColor = 'rgba(59, 130, 246, 0.1)'; // blue for meeting
                    borderColor = 'rgba(59, 130, 246, 0.2)';
                    textColor = '#60a5fa';
                    dotColor = '#3b82f6';
                  } else if (event.type === 'task') {
                    // Kendi görevini kontrol et
                    const isSelfAssigned = event.originalData?.assigned_to === currentUserId || 
                      event.originalData?.task_members?.some((m: any) => m.student_id === currentUserId);
                    
                    if (isSelfAssigned) {
                      bgColor = 'rgba(139, 92, 246, 0.1)'; // purple
                      borderColor = 'rgba(139, 92, 246, 0.2)';
                      textColor = '#a78bfa';
                      dotColor = '#8b5cf6';
                    } else {
                      bgColor = 'rgba(34, 197, 94, 0.1)'; // green
                      borderColor = 'rgba(34, 197, 94, 0.2)';
                      textColor = '#4ade80';
                      dotColor = '#22c55e';
                    }
                  }

                  return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick && onEventClick(event)}
                    className="text-xs p-1.5 rounded-md truncate cursor-pointer transition-transform hover:scale-[1.02] border"
                    style={{ backgroundColor: bgColor, borderColor: borderColor, color: textColor }}
                  >
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      <span className="truncate">{event.title}</span>
                    </div>
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
