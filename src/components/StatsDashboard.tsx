import React from 'react';
import { WorkoutLog, WorkoutType, WeightEntry } from '../types';
import { Flame, Clock, Trophy, Dumbbell, Bike, Footprints, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface StatsDashboardProps {
  logs: WorkoutLog[];
  weights?: WeightEntry[];
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

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs, weights = [] }) => {
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

  const getMinutesForDay = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return logs
      .filter(log => log.timestamp >= start.getTime() && log.timestamp <= end.getTime())
      .reduce((sum, log) => sum + log.durationMinutes, 0);
  };

  const weeklyChartData = weekDays.map(day => ({
    day: day.toLocaleDateString('en', { weekday: 'narrow' }),
    fullDay: day.toLocaleDateString('en', { weekday: 'short' }),
    date: day.getDate(),
    minutes: getMinutesForDay(day)
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailyMinutesData = last7Days.map(day => {
    const start = day.getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;
    const minutes = logs
      .filter(log => log.timestamp >= start && log.timestamp <= end)
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    return {
      date: day.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      minutes
    };
  });

  const weightChartData = [...weights]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      weight: entry.weight
    }));

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

  const recentLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

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

      {/* Weekly Minutes Bar Chart */}
      <div id="card-weekly-minutes" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Weekly Active Minutes</h3>
          <p className="text-xs text-zinc-500">Minutes exercised each day this week</p>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value: number) => [`${value} min`, 'Active Minutes']}
                labelFormatter={(_, payload: any) => payload?.[0]?.payload?.fullDay || ''}
              />
              <Bar dataKey="minutes" fill="#18181b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Trend Line Chart */}
      <div id="card-daily-trend" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Daily Activity Trend</h3>
          <p className="text-xs text-zinc-500">Last 7 days of exercise minutes</p>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyMinutesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value: number) => [`${value} min`, 'Minutes']}
              />
              <Line type="monotone" dataKey="minutes" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Mini Chart */}
      {weightChartData.length > 1 && (
        <div id="card-weight-trend" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Weight Trend</h3>
            <p className="text-xs text-zinc-500">Last 7 weight entries (kg)</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number) => [`${value} kg`, 'Weight']}
                />
                <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity Table */}
      {recentLogs.length > 0 && (
        <div id="card-recent-activity" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Recent Sessions</h3>
            <p className="text-xs text-zinc-500">Your latest workouts at a glance</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Date</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Type</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Duration</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-50/50">
                    <td className="px-3 py-2.5 text-zinc-700 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(log.type)}
                        <span className="text-zinc-700 font-medium">{log.type}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-900 font-bold">{log.durationMinutes} min</td>
                    <td className="px-3 py-2.5 text-zinc-500 truncate max-w-[150px]" title={log.notes}>
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
