import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'week';
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (mode: 'month' | 'week') => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-card/60 backdrop-blur-xl rounded-2xl border border-border/40 shadow-xl shadow-black/20 mb-6 gap-4">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent capitalize">
          {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: tr })}
        </h2>
        <div className="flex items-center bg-background/40 rounded-lg p-1 border border-border/50">
          <button
            onClick={onPrev}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            Bugün
          </button>
          <button
            onClick={onNext}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex bg-background/40 rounded-lg p-1 border border-border/50">
        <button
          onClick={() => onViewChange('month')}
          className={`flex items-center px-4 py-2 rounded-md transition-all text-sm font-medium ${
            viewMode === 'month'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <LayoutGrid size={16} className="mr-2" />
          Aylık
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`flex items-center px-4 py-2 rounded-md transition-all text-sm font-medium ${
            viewMode === 'week'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Calendar size={16} className="mr-2" />
          Haftalık
        </button>
      </div>
    </div>
  );
};
