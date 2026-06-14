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
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl mb-6 gap-4">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent capitalize">
          {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: tr })}
        </h2>
        <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5">
          <button
            onClick={onPrev}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
          >
            Bugün
          </button>
          <button
            onClick={onNext}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
        <button
          onClick={() => onViewChange('month')}
          className={`flex items-center px-4 py-2 rounded-md transition-all text-sm font-medium ${
            viewMode === 'month'
              ? 'bg-[#6366f1] text-white shadow-lg'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid size={16} className="mr-2" />
          Aylık
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`flex items-center px-4 py-2 rounded-md transition-all text-sm font-medium ${
            viewMode === 'week'
              ? 'bg-[#6366f1] text-white shadow-lg'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar size={16} className="mr-2" />
          Haftalık
        </button>
      </div>
    </div>
  );
};
