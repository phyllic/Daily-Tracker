import React, { useState, useEffect } from 'react';
import { WorkoutType, WorkoutLog } from '../types';
import { Calendar, Plus, Dumbbell, Bike, Footprints } from 'lucide-react';

interface QuickLogProps {
  defaultDurationMinutes: number;
  onLogWorkout: (log: Omit<WorkoutLog, 'id'>) => void;
  selectedDate: Date | null;
  onClearSelectedDate: () => void;
}

export const QuickLog: React.FC<QuickLogProps> = ({
  defaultDurationMinutes,
  onLogWorkout,
  selectedDate,
  onClearSelectedDate
}) => {
  const [type, setType] = useState<WorkoutType>(WorkoutType.INDOOR);
  const [duration, setDuration] = useState<number>(defaultDurationMinutes);
  const [dateStr, setDateStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Set dateStr initially to today's local date
  useEffect(() => {
    const today = new Date();
    const formatted = today.toISOString().substring(0, 10);
    setDateStr(formatted);
  }, []);

  // Update dateStr if selectedDate changes from calendar
  useEffect(() => {
    if (selectedDate) {
      const formatted = selectedDate.toISOString().substring(0, 10);
      setDateStr(formatted);
    }
  }, [selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || duration <= 0) return;

    // Parse chosen date back to a timestamp in local time
    const [year, month, day] = dateStr.split('-').map(Number);
    const logDate = new Date();
    logDate.setFullYear(year, month - 1, day);
    // Keep a reasonable current hour for sorting
    const now = new Date();
    logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);

    onLogWorkout({
      type,
      durationMinutes: duration,
      timestamp: logDate.getTime(),
      notes: notes.trim() ? notes.trim() : `Completed 30-min daily ${type.toLowerCase()} workout!`
    });

    // Reset notes but keep type & duration for subsequent quick entries
    setNotes('');
    onClearSelectedDate();
  };

  const getPresetButtonClass = (minutes: number) => {
    return duration === minutes
      ? 'bg-zinc-900 text-white border-transparent'
      : 'bg-white text-zinc-600 border-zinc-200/60 hover:border-zinc-300';
  };

  return (
    <div id="quick-log-card" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-6">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
          Quick Manual Log
        </h3>
        <p className="text-xs text-zinc-500">Log a workout instantly for today or any past date</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workout Style</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType(WorkoutType.INDOOR)}
              id="btn-quick-type-indoor"
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                type === WorkoutType.INDOOR
                  ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs'
                  : 'border-zinc-200/60 hover:border-zinc-350 text-zinc-500 bg-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Home Indoor</span>
            </button>

            <button
              type="button"
              onClick={() => setType(WorkoutType.WALK_RUN)}
              id="btn-quick-type-walkrun"
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                type === WorkoutType.WALK_RUN
                  ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs'
                  : 'border-zinc-200/60 hover:border-zinc-350 text-zinc-500 bg-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Walk / Run</span>
            </button>

            <button
              type="button"
              onClick={() => setType(WorkoutType.BICYCLE)}
              id="btn-quick-type-bicycle"
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                type === WorkoutType.BICYCLE
                  ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-xs'
                  : 'border-zinc-200/60 hover:border-zinc-350 text-zinc-500 bg-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Bicycle Ride</span>
            </button>
          </div>
        </div>

        {/* Duration picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration (Minutes)</label>
          <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
            <button
              type="button"
              onClick={() => setDuration(15)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${getPresetButtonClass(15)}`}
            >
              15 Min
            </button>
            <button
              type="button"
              onClick={() => setDuration(30)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${getPresetButtonClass(30)}`}
            >
              30 Min (Goal)
            </button>
            <button
              type="button"
              onClick={() => setDuration(45)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${getPresetButtonClass(45)}`}
            >
              45 Min
            </button>
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 ml-auto">
              <input
                type="number"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                id="quick-log-duration-input"
                className="w-14 text-center text-xs font-bold bg-white border border-zinc-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-xs font-semibold text-zinc-400">min</span>
            </div>
          </div>
        </div>

        {/* Date Selector & Optional Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Log Date
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              id="quick-log-date-input"
              required
              className="w-full text-xs px-3.5 py-2 border border-zinc-200 rounded-xl bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Optional Notes</label>
            <input
              type="text"
              placeholder="e.g., Breezy, felt steady!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="quick-log-notes-input"
              className="w-full text-xs px-3.5 py-2 border border-zinc-200 rounded-xl bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-700"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          id="btn-quick-log-submit"
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Log Workout Instantly
        </button>
      </form>
    </div>
  );
};
