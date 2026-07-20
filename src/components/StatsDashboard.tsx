import React from 'react';
import { WorkoutLog, WorkoutType } from '../types';
import { Flame, Calendar, Clock, Trophy, Dumbbell, Bike, Footprints } from 'lucide-react';

interface StatsDashboardProps {
  logs: WorkoutLog[];
}

export const calculateStreak = (logs: WorkoutLog[]): number => {
  if (logs.length === 0) return 0;

  const getStartOfDay = (timestamp: number) => {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const today = getStartOfDay(Date.now());
  const oneDayMs = 24 * 60 * 60 * 1000;

  const loggedDays = Array.from(new Set(logs.map(log => getStartOfDay(log.timestamp))))
    .sort((a, b) => b - a);

  if (loggedDays.length === 0) return 0;

  const mostRecent = loggedDays[0];
  
  // If the most recent log is older than yesterday, streak is 0
  if (today - mostRecent > oneDayMs) {
    return 0;
  }

  let streak = 0;
  let currentTargetDay = mostRecent;

  for (const loggedDay of loggedDays) {
    if (currentTargetDay === loggedDay) {
      streak++;
      currentTargetDay -= oneDayMs;
    } else if (loggedDay < currentTargetDay) {
      break;
    }
  }

  return streak;
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs }) => {
  const currentStreak = calculateStreak(logs);
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalWorkouts = logs.length;

  // Counts by type
  const indoorCount = logs.filter(l => l.type === WorkoutType.INDOOR).length;
  const walkRunCount = logs.filter(l => l.type === WorkoutType.WALK_RUN).length;
  const bicycleCount = logs.filter(l => l.type === WorkoutType.BICYCLE).length;

  // Calculate stats for current week (Mon-Sun)
  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday is 0
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const startOfWeek = getStartOfWeek();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const getWorkoutForDay = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return logs.find(log => log.timestamp >= start.getTime() && log.timestamp <= end.getTime());
  };

  const getTypeIcon = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.INDOOR:
        return <Dumbbell id="icon-indoor-week" className="w-4 h-4 text-emerald-600" />;
      case WorkoutType.WALK_RUN:
        return <Footprints id="icon-walk-week" className="w-4 h-4 text-blue-600" />;
      case WorkoutType.BICYCLE:
        return <Bike id="icon-bike-week" className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div id="stats-dashboard" className="space-y-6">
      {/* Metrics Row */}
      <div id="metrics-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <div id="card-streak" className="bg-white p-6 rounded-2xl border border-zinc-200/60 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Streak</p>
            <p className="text-3xl font-bold text-zinc-950 font-sans tracking-tight">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">
              {currentStreak > 0 ? 'Keep the momentum going!' : 'Log today to start a streak!'}
            </p>
          </div>
          <Flame id="metric-flame-icon" className={`w-5 h-5 ${currentStreak > 0 ? 'text-zinc-800 fill-current' : 'text-zinc-300'}`} />
        </div>

        {/* Total Workouts Card */}
        <div id="card-total-workouts" className="bg-white p-6 rounded-2xl border border-zinc-200/60 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Workouts</p>
            <p className="text-3xl font-bold text-zinc-950 font-sans tracking-tight">
              {totalWorkouts}
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">Sessions tracked offline</p>
          </div>
          <Trophy id="metric-trophy-icon" className="w-5 h-5 text-zinc-800" />
        </div>

        {/* Total Time Card */}
        <div id="card-total-time" className="bg-white p-6 rounded-2xl border border-zinc-200/60 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time Exercised</p>
            <p className="text-3xl font-bold text-zinc-950 font-sans tracking-tight">
              {totalMinutes} <span className="text-sm font-medium text-zinc-400">min</span>
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">
              {totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)} hours total` : 'Every minute counts!'}
            </p>
          </div>
          <Clock id="metric-clock-icon" className="w-5 h-5 text-zinc-800" />
        </div>
      </div>

      {/* Weekly Checklist Row */}
      <div id="card-weekly-tracker" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Weekly Habit Tracker
            </h3>
            <p className="text-xs text-zinc-500">Complete any of your 3 options daily to track consistency</p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-zinc-100 text-zinc-800 rounded-full">
            {weekDays.filter(getWorkoutForDay).length} / 7 Days Complete
          </span>
        </div>

        <div id="weekly-days-row" className="grid grid-cols-7 gap-2 pt-1">
          {weekDays.map((day, idx) => {
            const workout = getWorkoutForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={idx} 
                id={`weekly-day-${idx}`}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  workout 
                    ? 'bg-zinc-900 border-zinc-900 text-white' 
                    : isToday 
                    ? 'bg-white border-zinc-900 ring-1 ring-zinc-900/10 text-zinc-900' 
                    : 'bg-zinc-50/50 border-zinc-100 text-zinc-400'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${workout ? 'text-zinc-400' : 'text-zinc-400'}`}>
                  {day.toLocaleDateString('en', { weekday: 'short' }).substring(0, 2)}
                </span>
                <span className="text-xs font-extrabold mt-0.5">
                  {day.getDate()}
                </span>
                <div className="mt-2 h-6 flex items-center justify-center">
                  {workout ? (
                    <div className="text-white">
                      {workout.type === WorkoutType.INDOOR && <Dumbbell className="w-3.5 h-3.5" />}
                      {workout.type === WorkoutType.WALK_RUN && <Footprints className="w-3.5 h-3.5" />}
                      {workout.type === WorkoutType.BICYCLE && <Bike className="w-3.5 h-3.5" />}
                    </div>
                  ) : (
                    <span className={`text-xs ${isToday ? 'text-zinc-900 font-bold' : 'text-zinc-200'}`}>•</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Bar Chart */}
      <div id="card-breakdown" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Workout Distribution</h3>
          <p className="text-xs text-zinc-500">Compare completion rates across your 3 personal options</p>
        </div>

        <div id="distribution-progress-bars" className="space-y-5">
          {/* Home Indoor */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-zinc-600" />
                Home Indoor
              </span>
              <span className="text-zinc-900 font-bold">{indoorCount} sessions</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 rounded-full transition-all duration-500" 
                style={{ width: `${totalWorkouts > 0 ? (indoorCount / totalWorkouts) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Walk / Run */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-2">
                <Footprints className="w-3.5 h-3.5 text-zinc-600" />
                Walk / Run
              </span>
              <span className="text-zinc-900 font-bold">{walkRunCount} sessions</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 rounded-full transition-all duration-500" 
                style={{ width: `${totalWorkouts > 0 ? (walkRunCount / totalWorkouts) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Bicycle Ride */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-2">
                <Bike className="w-3.5 h-3.5 text-zinc-600" />
                Bicycle Ride
              </span>
              <span className="text-zinc-900 font-bold">{bicycleCount} sessions</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 rounded-full transition-all duration-500" 
                style={{ width: `${totalWorkouts > 0 ? (bicycleCount / totalWorkouts) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
