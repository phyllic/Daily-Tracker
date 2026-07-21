import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Calendar, History, Settings as SettingsIcon, 
  Sparkles, Dumbbell, Bike, Footprints, Info, 
  Trash2, RefreshCw, Download, Upload, Volume2, VolumeX,
  X, CheckCircle2, Clock
} from 'lucide-react';

// Import Types and Data
import { WorkoutLog, WorkoutType, UserPreferences, WeightEntry } from './types';
import { DEFAULT_PREFERENCES, getMockHistory } from './defaultData';

// Import Custom Modular Components
import { StatsDashboard, calculateStreak } from './components/StatsDashboard';
import { CalendarView } from './components/CalendarView';
import { ActiveTimer } from './components/ActiveTimer';
import { QuickLog } from './components/QuickLog';
import { HistoryList } from './components/HistoryList';
import { WeightTracker } from './components/WeightTracker';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'history' | 'settings'>('dashboard');

  // Input view inside dashboard (Timer vs Quick Manual)
  const [dashboardInputType, setDashboardInputType] = useState<'timer' | 'manual'>('timer');

  // Database States
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Selected date from calendar to quick-log
  const [selectedDateForLog, setSelectedDateForLog] = useState<Date | null>(null);

  // Completed Celebration State
  const [recentCompletedWorkout, setRecentCompletedWorkout] = useState<WorkoutLog | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    // 1. Preferences
    const savedPrefs = localStorage.getItem('workout_preferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error("Failed loading preferences", e);
      }
    }

    // 2. History
    const savedHistory = localStorage.getItem('workout_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed loading history", e);
      }
    } else {
      // Seed beautiful mock history of walks, rides, and indoor sessions
      const mockHist = getMockHistory();
      setHistory(mockHist);
      localStorage.setItem('workout_history', JSON.stringify(mockHist));
    }

    // 3. Weights
    const savedWeights = localStorage.getItem('workout_weights');
    if (savedWeights) {
      try {
        setWeights(JSON.parse(savedWeights));
      } catch (e) {
        console.error("Failed loading weights", e);
      }
    }
  }, []);

  // Synchronizers
  const updateHistory = (newHistory: WorkoutLog[]) => {
    setHistory(newHistory);
    localStorage.setItem('workout_history', JSON.stringify(newHistory));
  };

  const updateWeights = (newWeights: WeightEntry[]) => {
    setWeights(newWeights);
    localStorage.setItem('workout_weights', JSON.stringify(newWeights));
  };

  const updatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('workout_preferences', JSON.stringify(newPrefs));
  };

  // --- Actions ---

  // Log a new session
  const handleLogWorkout = (rawLog: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = {
      ...rawLog,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const updated = [newLog, ...history];
    updateHistory(updated);

    // Prompt congratulations modal
    setRecentCompletedWorkout(newLog);
  };

  // Delete a session
  const handleDeleteLog = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    updateHistory(updated);
  };

  // Log a new weight entry
  const handleLogWeight = (entry: Omit<WeightEntry, 'id'>) => {
    const newEntry: WeightEntry = {
      ...entry,
      id: `weight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    const updated = [newEntry, ...weights];
    // Keep only one entry per date (latest wins)
    const byDate = new Map<string, WeightEntry>();
    updated.forEach(e => byDate.set(e.date, e));
    const deduped = Array.from(byDate.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    updateWeights(deduped);
  };

  // Delete a weight entry
  const handleDeleteWeight = (id: string) => {
    const updated = weights.filter(item => item.id !== id);
    updateWeights(updated);
  };

  // Calendar bridge: When a user clicks empty calendar slot, switch to quick manual log and fill date
  const handleSelectDateToLog = (date: Date) => {
    setSelectedDateForLog(date);
    setDashboardInputType('manual');
    setActiveTab('dashboard');
  };

  // Toggle chime sound preference
  const handleToggleSound = () => {
    const updated = {
      ...preferences,
      soundEnabled: !preferences.soundEnabled
    };
    updatePreferences(updated);
  };

  // Reset entire database
  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear your entire workout history and weight data? This action cannot be undone.")) {
      updateHistory([]);
      updateWeights([]);
      updatePreferences(DEFAULT_PREFERENCES);
    }
  };

  // Reseed default historical data
  const handleResetToDemo = () => {
    if (window.confirm("This will reset your workout history to the pre-filled 14-day sample history. Proceed?")) {
      const mockHist = getMockHistory();
      updateHistory(mockHist);
      updatePreferences(DEFAULT_PREFERENCES);
    }
  };

  // Client-side JSON backup download
  const handleExportJSON = () => {
    const data = {
      version: 'workout-tracker-v2',
      history,
      weights,
      preferences,
      exportedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simple_workout_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Client-side JSON backup upload
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.history)) {
          updateHistory(parsed.history);
          if (Array.isArray(parsed.weights)) {
            updateWeights(parsed.weights);
          }
          if (parsed.preferences) {
            updatePreferences(parsed.preferences);
          }
          alert("Backup data successfully imported!");
        } else {
          alert("Invalid file format. Ensure it is a valid workout tracker backup file.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Icon mapping for header decoration
  const getCompletedWorkoutIcon = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.INDOOR:
        return <Dumbbell className="w-10 h-10 text-emerald-600" />;
      case WorkoutType.WALK_RUN:
        return <Footprints className="w-10 h-10 text-blue-600" />;
      case WorkoutType.BICYCLE:
        return <Bike className="w-10 h-10 text-indigo-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Upper Elegant Nav Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100/80 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
              Daily Tracker
            </span>
            <span className="text-xs text-zinc-300">•</span>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              My 3 Options
            </span>
          </div>

          {/* Mini active streak widget in top-right */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full">
            <Flame id="header-streak-icon" className="w-3.5 h-3.5 text-zinc-800 fill-current" />
            <span className="text-[11px] font-bold text-zinc-800">
              {calculateStreak(history)} Day Streak
            </span>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-6 py-8 mb-20">
        
        {/* Navigation Tabs */}
        <div id="nav-tabs-wrapper" className="flex border-b border-zinc-200/60 gap-8 mb-8 pb-0.5">
          {(['dashboard', 'calendar', 'history', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              id={`tab-btn-${tab}`}
              className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition-all relative uppercase ${
                activeTab === tab
                  ? 'text-zinc-900 font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-800'
              }`}
            >
              {tab === 'history' ? 'History Logs' : tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Info banner about simple lifestyle */}
              <div id="welcome-info-banner" className="bg-white border border-gray-100 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">Your Simple Daily Philosophy</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    No complicated gyms, no heavy weights. Just three simple daily options: a 30-minute <strong>Home Indoor</strong> workout, an outdoor <strong>Walk/Run</strong>, or a <strong>Bicycle Ride</strong>. Choose one, set the timer or log manually, and stay healthy!
                  </p>
                </div>
              </div>

              <div id="dashboard-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Stats Dashboard (consecutive streak, distribution counts, weekly boxes) */}
                <div className="lg:col-span-7 space-y-6">
                  <StatsDashboard logs={history} weights={weights} />
                  <WeightTracker
                    weights={weights}
                    preferences={preferences}
                    onLogWeight={handleLogWeight}
                    onDeleteWeight={handleDeleteWeight}
                    onUpdateUnit={(unit) => updatePreferences({ ...preferences, weightUnit: unit })}
                  />
                </div>

                {/* Tracking Action Area */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Local Sub-tabs: Active Timer vs Manual Entry */}
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      onClick={() => setDashboardInputType('timer')}
                      id="subtab-timer"
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${
                        dashboardInputType === 'timer'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Timer
                    </button>
                    <button
                      onClick={() => setDashboardInputType('manual')}
                      id="subtab-manual"
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${
                        dashboardInputType === 'manual'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Quick Log
                    </button>
                  </div>

                  {dashboardInputType === 'timer' ? (
                    <ActiveTimer
                      defaultDuration={preferences.defaultDurationMinutes}
                      soundEnabled={preferences.soundEnabled}
                      onLogWorkout={handleLogWorkout}
                      onToggleSound={handleToggleSound}
                    />
                  ) : (
                    <QuickLog
                      defaultDurationMinutes={preferences.defaultDurationMinutes}
                      onLogWorkout={handleLogWorkout}
                      selectedDate={selectedDateForLog}
                      onClearSelectedDate={() => setSelectedDateForLog(null)}
                    />
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView
                logs={history}
                onSelectDateToLog={handleSelectDateToLog}
                onDeleteLog={handleDeleteLog}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Completed Workouts history</h3>
                  <p className="text-xs text-gray-500">Every single step, pedal, and indoor stretch logged securely offline</p>
                </div>
                <HistoryList logs={history} onDeleteLog={handleDeleteLog} />
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              {/* Settings Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Preferences & Database Controls</h3>
                  <p className="text-xs text-gray-500">Manage your local variables, sounds, and offline backup logs</p>
                </div>

                {/* Preference toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-700">Synthesized Chime Sound</span>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Web Audio API double chime alert on session completion</p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      id="btn-settings-toggle-sound"
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        preferences.soundEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {preferences.soundEnabled ? 'Enabled' : 'Muted'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-700">Default Target Duration (Minutes)</span>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">The target duration preset on load (Typically 30 minutes)</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={preferences.defaultDurationMinutes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 30;
                          updatePreferences({ ...preferences, defaultDurationMinutes: val });
                        }}
                        id="settings-default-duration-input"
                        className="w-16 text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <span className="text-xs font-semibold text-gray-400">min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-700">Weight Unit</span>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Display weights in kilograms or pounds</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => updatePreferences({ ...preferences, weightUnit: 'kg' })}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${preferences.weightUnit === 'kg' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'}`}
                      >
                        KG
                      </button>
                      <button
                        onClick={() => updatePreferences({ ...preferences, weightUnit: 'lbs' })}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${preferences.weightUnit === 'lbs' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'}`}
                      >
                        LBS
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backup export/import */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Backup & Migration</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleExportJSON}
                      id="btn-settings-export"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-all"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                      Export Backup (JSON)
                    </button>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-all cursor-pointer">
                      <Upload className="w-4 h-4 text-gray-500" />
                      Import Backup (JSON)
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Danger zone / Developer seed */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Danger Zone</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleResetToDemo}
                      id="btn-settings-reseed"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reseed 14-Day Sample History
                    </button>
                    <button
                      onClick={handleClearAllData}
                      id="btn-settings-clear"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Wipe All Workout History
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Elegant Footer containing credit */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-medium">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p>Secure local offline tracker. No data ever leaves your browser container.</p>
          <p>© 2026 Daily 30-Min Tracker. Designed with functional simplicity.</p>
        </div>
      </footer>

      {/* --- FINISH CELEBRATION MODAL OVERLAY --- */}
      <AnimatePresence>
        {recentCompletedWorkout && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl border border-gray-100 relative"
            >
              {/* Particle effect top bar decoration */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />
              
              <button
                onClick={() => setRecentCompletedWorkout(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mt-4 mb-4 border border-emerald-100 animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="font-extrabold text-xl text-gray-900 flex items-center justify-center gap-2">
                Log Recorded! <Sparkles className="w-5 h-5 text-amber-400 fill-current shrink-0" />
              </h2>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Superb job! You completed your daily target and added a session to your personal offline database.
              </p>

              {/* Congratulatory Stats Box */}
              <div className="grid grid-cols-2 gap-3 mt-6 mb-6 text-center">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                  <div className="mb-1">{getCompletedWorkoutIcon(recentCompletedWorkout.type)}</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Workout Style</span>
                  <p className="text-xs font-extrabold text-gray-900 mt-0.5 truncate max-w-[120px]">
                    {recentCompletedWorkout.type}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                  <Clock className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Duration</span>
                  <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                    {recentCompletedWorkout.durationMinutes} min
                  </p>
                </div>
              </div>

              {recentCompletedWorkout.notes && (
                <div className="bg-gray-50 p-3 rounded-xl text-left mb-6 border border-gray-100">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Your Session Comments:</span>
                  <p className="text-gray-700 text-xs italic mt-0.5 leading-relaxed font-medium">
                    "{recentCompletedWorkout.notes}"
                  </p>
                </div>
              )}

              <button
                onClick={() => setRecentCompletedWorkout(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-700/10"
              >
                Keep Up the Momentum
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
