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
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div 
        className="grid bg-black/20 border-b border-white/5" 
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-white/60">
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
              className={`p-2 border-b border-r border-white/5 transition-colors hover:bg-white/5 ${
                !isCurrentMonth ? 'opacity-30 bg-black/10' : ''
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/30' : 'text-white/80'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[70px] pr-1 custom-scrollbar">
                {dayEvents.map(event => {
                  let bgColor = 'rgba(249, 115, 22, 0.2)'; // orange
                  let borderColor = 'rgba(249, 115, 22, 0.3)';
                  let textColor = '#fdba74';
                  let dotColor = '#fb923c';
                  
                  if (event.type === 'meeting') {
                    bgColor = 'rgba(59, 130, 246, 0.2)'; // blue
                    borderColor = 'rgba(59, 130, 246, 0.3)';
                    textColor = '#93c5fd';
                    dotColor = '#60a5fa';
                  } else if (event.type === 'task') {
                    // Kendi görevini kontrol et
                    const isSelfAssigned = event.originalData?.assigned_to === currentUserId || 
                      event.originalData?.task_members?.some((m: any) => m.student_id === currentUserId);
                    
                    if (isSelfAssigned) {
                      bgColor = 'rgba(139, 92, 246, 0.2)'; // purple
                      borderColor = 'rgba(139, 92, 246, 0.3)';
                      textColor = '#c4b5fd';
                      dotColor = '#a78bfa';
                    } else {
                      bgColor = 'rgba(34, 197, 94, 0.2)'; // green
                      borderColor = 'rgba(34, 197, 94, 0.3)';
                      textColor = '#86efac';
                      dotColor = '#4ade80';
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
