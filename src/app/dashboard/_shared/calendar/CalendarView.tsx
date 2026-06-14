'use client';

import React, { useState } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { MonthGrid } from './MonthGrid';
import { WeekGrid } from './WeekGrid';
import type { CalendarEvent } from '@/types/kanban';

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  currentUserId?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventClick, currentUserId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={setViewMode}
      />
      
      <div className="flex-1 overflow-hidden">
        {viewMode === 'month' ? (
          <MonthGrid currentDate={currentDate} events={events} onEventClick={onEventClick} currentUserId={currentUserId} />
        ) : (
          <WeekGrid currentDate={currentDate} events={events} onEventClick={onEventClick} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
};
