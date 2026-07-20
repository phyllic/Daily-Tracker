import React, { useState } from 'react';
import { WorkoutLog, WorkoutType } from '../types';
import { ChevronLeft, ChevronRight, Dumbbell, Bike, Footprints, Plus, Trash2, Calendar } from 'lucide-react';

interface CalendarViewProps {
  logs: WorkoutLog[];
  onSelectDateToLog: (date: Date) => void;
  onDeleteLog: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, onSelectDateToLog, onDeleteLog }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDayLogs, setSelectedDayLogs] = useState<{ date: Date; logs: WorkoutLog[] } | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDayLogs(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDayLogs(null);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Adjust first day index so Monday is 0 (optional, but let's stick to standard Sunday = 0 for simplicity)
  // Let's draw empty pads
  const emptyPads = Array.from({ length: firstDayIndex });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getLogsForDay = (day: number) => {
    const start = new Date(year, month, day, 0, 0, 0, 0).getTime();
    const end = new Date(year, month, day, 23, 59, 59, 999).getTime();
    return logs.filter(log => log.timestamp >= start && log.timestamp <= end);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    const dayLogs = getLogsForDay(day);
    setSelectedDayLogs({ date: clickedDate, logs: dayLogs });
  };

  const getIndicatorColor = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.INDOOR:
        return 'bg-zinc-900';
      case WorkoutType.WALK_RUN:
        return 'bg-zinc-500';
      case WorkoutType.BICYCLE:
        return 'bg-zinc-300';
    }
  };

  const getDayIcon = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.INDOOR:
        return <Dumbbell className="w-3.5 h-3.5 text-zinc-800" />;
      case WorkoutType.WALK_RUN:
        return <Footprints className="w-3.5 h-3.5 text-zinc-800" />;
      case WorkoutType.BICYCLE:
        return <Bike className="w-3.5 h-3.5 text-zinc-800" />;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div id="calendar-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid Card */}
      <div id="calendar-card" className="bg-white p-6 rounded-2xl border border-zinc-200/60 lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              id="btn-prev-month"
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 border border-zinc-200/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              id="btn-next-month"
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 border border-zinc-200/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Board */}
        <div id="calendar-board">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-zinc-100/60 pb-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <span key={day} className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty padding days */}
            {emptyPads.map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square bg-zinc-50/30 rounded-lg" />
            ))}

            {/* Actual Month Days */}
            {monthDays.map(day => {
              const dayLogs = getLogsForDay(day);
              const hasWorkouts = dayLogs.length > 0;
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
              const isSelected = selectedDayLogs && selectedDayLogs.date.getDate() === day && selectedDayLogs.date.getMonth() === month && selectedDayLogs.date.getFullYear() === year;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  id={`calendar-day-btn-${day}`}
                  className={`aspect-square flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-left group hover:scale-[1.01] relative ${
                    hasWorkouts
                      ? 'bg-zinc-50/60 border-zinc-200 text-zinc-900 font-bold'
                      : 'bg-white border-zinc-100 text-zinc-700'
                  } ${
                    isToday ? 'ring-2 ring-zinc-900 border-transparent font-extrabold' : ''
                  } ${
                    isSelected ? 'ring-2 ring-zinc-500 border-transparent' : ''
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-zinc-950' : 'text-zinc-600 font-semibold'}`}>
                    {day}
                  </span>

                  {/* Dot / Indicator Row */}
                  <div className="flex gap-0.5 justify-center w-full min-h-[6px]">
                    {dayLogs.map((log, lIdx) => (
                      <span
                        key={lIdx}
                        className={`w-1.5 h-1.5 rounded-full ${getIndicatorColor(log.type)}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div id="calendar-legend" className="flex items-center gap-4 pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-900" />
            Home Indoor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            Walk / Run
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-300" />
            Bicycle Ride
          </span>
        </div>
      </div>

      {/* Details / Side Panel */}
      <div id="calendar-detail-panel" className="bg-white p-6 rounded-2xl border border-zinc-200/60 flex flex-col justify-between">
        {selectedDayLogs ? (
          <div className="space-y-4 flex-1">
            <div className="border-b border-zinc-100 pb-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Selected Day</span>
              <h4 className="font-bold text-zinc-900 text-sm">
                {selectedDayLogs.date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </h4>
            </div>

            {selectedDayLogs.logs.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedDayLogs.logs.map(log => (
                  <div key={log.id} className="p-3.5 bg-zinc-50/50 rounded-xl border border-zinc-200/40 relative group/item">
                    <button
                      onClick={() => {
                        onDeleteLog(log.id);
                        // Refresh selections
                        setSelectedDayLogs({
                          date: selectedDayLogs.date,
                          logs: selectedDayLogs.logs.filter(l => l.id !== log.id)
                        });
                      }}
                      id={`delete-daylog-${log.id}`}
                      className="absolute top-2.5 right-2.5 p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1 bg-white rounded-lg border border-zinc-200/40">
                        {getDayIcon(log.type)}
                      </div>
                      <span className="font-bold text-zinc-800 text-xs uppercase tracking-wider">
                        {log.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-2">
                      <span>Duration: <strong>{log.durationMinutes} min</strong></span>
                    </div>
                    {log.notes && (
                      <p className="text-[11px] text-zinc-600 italic bg-white p-2 rounded-lg border border-zinc-100">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 text-sm space-y-3">
                <p className="text-xs">No workouts logged for this day yet.</p>
                <button
                  onClick={() => onSelectDateToLog(selectedDayLogs.date)}
                  id="btn-log-on-selected-day"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-zinc-200 hover:border-zinc-300 text-zinc-800 rounded-lg transition-colors uppercase tracking-wider"
                >
                  <Plus className="w-3 h-3" />
                  Log Workout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-zinc-400 space-y-2">
            <Calendar className="w-8 h-8 text-zinc-200" />
            <p className="text-xs font-bold text-zinc-850 uppercase tracking-wider">Select a day</p>
            <p className="text-[11px] max-w-[200px] leading-relaxed">View completed logs or easily add a workout for any specific date.</p>
          </div>
        )}

        {selectedDayLogs && selectedDayLogs.logs.length > 0 && (
          <div className="pt-4 border-t border-zinc-100 mt-4 flex justify-end">
            <button
              onClick={() => onSelectDateToLog(selectedDayLogs.date)}
              id="btn-add-another-on-day"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl uppercase tracking-wider transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Log
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
