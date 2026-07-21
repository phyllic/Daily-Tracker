import React, { useState, useEffect, useRef } from 'react';
import { WorkoutType, WorkoutLog } from '../types';
import { Play, Pause, RotateCcw, Check, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface ActiveTimerProps {
  defaultDuration: number;
  soundEnabled: boolean;
  onLogWorkout: (log: Omit<WorkoutLog, 'id'>) => void;
  onToggleSound: () => void;
}

const MOTIVATIONAL_TIPS = {
  [WorkoutType.INDOOR]: [
    "Warm up your joints first! Arm circles and high knees.",
    "Engage your core. Focus on form, not speed.",
    "Breathe naturally. Exhale on exertion, inhale on release.",
    "No equipment needed, just your dedication.",
    "Keep your movements controlled and clean.",
    "You are doing amazing. Every repetition counts!"
  ],
  [WorkoutType.WALK_RUN]: [
    "Pace yourself. Find a steady rhythm that feels sustainable.",
    "Stand tall, keep your shoulders relaxed and chin up.",
    "Pump your arms gently to help maintain your stride.",
    "Take a deep breath of fresh air.",
    "Look ahead, enjoy the scenery around you.",
    "Excellent pace! Keep moving!"
  ],
  [WorkoutType.BICYCLE]: [
    "Adjust your posture. Squeeze your core and keep your back flat.",
    "Pedal with a smooth, consistent cadence.",
    "Relax your grip on the handlebars.",
    "Hydrate if you brought a bottle.",
    "Focus on pushing and pulling through each pedal stroke.",
    "Great job cycling! Enjoy the momentum!"
  ]
};

const TIMER_STORAGE_KEY = 'active_timer_state';

interface TimerState {
  selectedType: WorkoutType;
  startTime: number | null;
  accumulatedSeconds: number;
  isActive: boolean;
  sessionNotes: string;
  goalChimePlayed: boolean;
}

export const ActiveTimer: React.FC<ActiveTimerProps> = ({
  defaultDuration,
  soundEnabled,
  onLogWorkout,
  onToggleSound
}) => {
  const [selectedType, setSelectedType] = useState<WorkoutType>(WorkoutType.INDOOR);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [goalChimePlayed, setGoalChimePlayed] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goalSeconds = defaultDuration * 60;

  // Sound Synth Bell function
  const playSynthesizedBell = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playTone(523.25, audioCtx.currentTime, 1.2);
      playTone(659.25, audioCtx.currentTime + 0.35, 1.5);
    } catch (e) {
      console.warn("AudioContext failed to play sound. Safe fallback.", e);
    }
  };

  const saveTimerState = () => {
    const state: TimerState = {
      selectedType,
      startTime: startTimeRef.current,
      accumulatedSeconds: accumulatedRef.current,
      isActive,
      sessionNotes,
      goalChimePlayed,
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  };

  const loadTimerState = (): TimerState | null => {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TimerState;
    } catch {
      return null;
    }
  };

  const clearTimerState = () => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (e) {
      console.warn('Wake Lock request failed', e);
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (e) {
      console.warn('Wake Lock release failed', e);
    }
  };

  const recalculateElapsed = () => {
    if (startTimeRef.current === null) return;
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000) + accumulatedRef.current;
    setSecondsElapsed(elapsed);

    if (elapsed >= goalSeconds && !goalChimePlayed) {
      playSynthesizedBell();
      setGoalChimePlayed(true);
      showGoalNotification();
    }
  };

  const showGoalNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('Workout Goal Reached!', {
            body: `Great job! You hit your ${defaultDuration}-minute ${selectedType} goal.`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'workout-goal'
          });
        });
      } catch (e) {
        new Notification('Workout Goal Reached!', {
          body: `Great job! You hit your ${defaultDuration}-minute ${selectedType} goal.`,
          icon: '/icon-192.png'
        });
      }
    }
  };

  const scheduleNotification = (remainingSeconds: number) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    if (!('Notification' in window)) return;

    if (remainingSeconds > 0 && remainingSeconds < 3600) {
      notificationTimeoutRef.current = setTimeout(() => {
        recalculateElapsed();
      }, remainingSeconds * 1000 + 500);
    }
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setIsActive(true);
    requestWakeLock();
    requestNotificationPermission();
    saveTimerState();
  };

  const pauseTimer = () => {
    if (startTimeRef.current !== null) {
      const now = Date.now();
      accumulatedRef.current += Math.floor((now - startTimeRef.current) / 1000);
      startTimeRef.current = null;
    }
    setIsActive(false);
    releaseWakeLock();
    saveTimerState();
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsElapsed(0);
    setSessionNotes('');
    setGoalChimePlayed(false);
    setTipIndex(0);
    startTimeRef.current = null;
    accumulatedRef.current = 0;
    releaseWakeLock();
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    clearTimerState();
  };

  const handleStartPause = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = () => {
    resetTimer();
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Restore persisted timer on mount
  useEffect(() => {
    const state = loadTimerState();
    if (state) {
      setSelectedType(state.selectedType);
      setSessionNotes(state.sessionNotes);
      setGoalChimePlayed(state.goalChimePlayed);
      accumulatedRef.current = state.accumulatedSeconds;
      setIsActive(state.isActive);

      if (state.isActive && state.startTime) {
        startTimeRef.current = state.startTime;
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000) + state.accumulatedSeconds;
        setSecondsElapsed(elapsed);
        requestWakeLock();
        requestNotificationPermission();
        if (elapsed >= goalSeconds && !state.goalChimePlayed) {
          setTimeout(() => {
            playSynthesizedBell();
            setGoalChimePlayed(true);
            showGoalNotification();
          }, 500);
        }
      } else {
        setSecondsElapsed(state.accumulatedSeconds);
      }
    }

    return () => {
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interval tick - update UI every second
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        recalculateElapsed();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, goalSeconds, soundEnabled, goalChimePlayed]);

  // Recalculate and schedule notification when active or remaining changes
  useEffect(() => {
    if (isActive && startTimeRef.current !== null) {
      const remaining = Math.max(0, goalSeconds - secondsElapsed);
      scheduleNotification(remaining);
    }
    saveTimerState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsElapsed, isActive, goalSeconds]);

  // Handle page visibility changes (switching apps, locking phone)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store accurate accumulated time when leaving
        if (isActive && startTimeRef.current !== null) {
          const now = Date.now();
          accumulatedRef.current += Math.floor((now - startTimeRef.current) / 1000);
          startTimeRef.current = now;
          saveTimerState();
        }
      } else {
        // Recalculate when returning
        if (isActive && startTimeRef.current !== null) {
          recalculateElapsed();
          requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, goalSeconds, soundEnabled, goalChimePlayed]);

  // Reacquire wake lock if it was released (e.g. tab hidden then shown)
  useEffect(() => {
    const handleVisibilityVisible = () => {
      if (!document.hidden && isActive && !wakeLockRef.current) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityVisible);
    return () => document.removeEventListener('visibilitychange', handleVisibilityVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Goal chime effect (fallback if interval misses it)
  useEffect(() => {
    if (secondsElapsed >= goalSeconds && !goalChimePlayed && isActive) {
      playSynthesizedBell();
      setGoalChimePlayed(true);
      showGoalNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsElapsed, goalSeconds, goalChimePlayed, isActive]);

  // Rotate tips
  useEffect(() => {
    if (isActive) {
      const tipInterval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % MOTIVATIONAL_TIPS[selectedType].length);
      }, 15000);

      return () => clearInterval(tipInterval);
    }
  }, [isActive, selectedType]);

  // Format stopwatch display (MM:SS or H:MM:SS)
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSaveWorkout = () => {
    // Pause and capture final time
    if (isActive) {
      pauseTimer();
    }

    const elapsedMinutes = Math.max(1, Math.round(secondsElapsed / 60));

    onLogWorkout({
      type: selectedType,
      durationMinutes: elapsedMinutes,
      timestamp: Date.now(),
      notes: sessionNotes.trim() ? sessionNotes.trim() : `Completed ${elapsedMinutes}-min active ${selectedType.toLowerCase()} session!`
    });

    handleReset();
  };

  // Progress toward 30-minute goal (defaultDuration)
  const progressPercent = Math.min(100, (secondsElapsed / goalSeconds) * 100);

  return (
    <div id="active-timer-card" className="bg-white p-6 rounded-2xl border border-zinc-200/60 space-y-6">

      {/* Option Selector (Only visible if stopwatch hasn't started yet) */}
      {secondsElapsed === 0 && !isActive && (
        <div id="timer-config-panel" className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Daily Workout Stopwatch</h3>
            <p className="text-xs text-zinc-500">Pick your workout style and start tracking active time</p>
          </div>

          <div id="type-selector-buttons" className="grid grid-cols-3 gap-2.5">
            {Object.values(WorkoutType).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                id={`btn-select-type-${type.replace(/\s+/g, '-')}`}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  selectedType === type
                    ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-sm'
                    : 'border-zinc-200/60 hover:border-zinc-350 text-zinc-500 bg-white'
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider text-zinc-400">Option</span>
                <span className="text-xs font-bold truncate w-full mt-0.5">{type}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Circular Stopwatch Interface */}
      <div id="main-timer-ring-area" className="flex flex-col items-center justify-center py-4 space-y-6">

        {/* SVG Ring Timer */}
        <div className="relative w-60 h-60 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Ring */}
            <circle
              cx="120"
              cy="120"
              r="102"
              className="text-zinc-100 stroke-current"
              strokeWidth="4"
              fill="transparent"
              transform="translate(10, 10)"
            />
            {/* Progress Ring */}
            <circle
              cx="120"
              cy="120"
              r="102"
              className="text-zinc-900 stroke-current transition-all duration-1000 ease-linear"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="641"
              strokeDashoffset={641 - (641 * progressPercent) / 100}
              strokeLinecap="round"
              transform="translate(10, 10)"
            />
          </svg>

          {/* Time & Label inside */}
          <div className="absolute flex flex-col items-center text-center space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              {selectedType}
            </span>
            <span className="text-4xl font-extrabold text-zinc-950 tracking-tighter font-mono">
              {formatTime(secondsElapsed)}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {secondsElapsed >= goalSeconds ? (
                <>
                  <Sparkles className="w-3 h-3 text-zinc-800" />
                  Goal Achieved!
                </>
              ) : (
                `${progressPercent.toFixed(0)}% of ${defaultDuration}m Goal`
              )}
            </span>
          </div>
        </div>

        {/* Background status hint */}
        {isActive && (
          <div className="w-full max-w-sm text-center">
            <p className="text-[10px] text-zinc-400 font-medium">
              Timer keeps running when you switch apps or lock your phone. It resumes automatically when you return.
            </p>
          </div>
        )}

        {/* Tips Box */}
        {(isActive || secondsElapsed > 0) && (
          <div id="motivational-tips-box" className="w-full max-w-sm border-l border-zinc-900 pl-4 py-1">
            <p className="text-[11px] text-zinc-500 italic leading-relaxed font-medium">
              "{MOTIVATIONAL_TIPS[selectedType][tipIndex]}"
            </p>
          </div>
        )}

        {/* Notes input while/after workout */}
        {secondsElapsed > 0 && (
          <div id="notes-logging-field" className="w-full max-w-sm space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Session Notes (optional)</label>
            <input
              type="text"
              placeholder="How did you feel? Smooth pace?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              id="notes-field-timer"
              className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-700"
            />
          </div>
        )}

        {/* Action Controls */}
        <div id="timer-action-controls" className="flex flex-col gap-2.5 w-full max-w-sm">
          <div className="flex items-center gap-3 w-full">
            {/* Play / Pause / Resume */}
            <button
              onClick={handleStartPause}
              id="btn-timer-start-pause"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {secondsElapsed === 0 ? 'Start Session' : 'Resume'}
                </>
              )}
            </button>

            {/* Reset */}
            {secondsElapsed > 0 && (
              <button
                onClick={handleReset}
                id="btn-timer-reset"
                className="p-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 rounded-xl border border-zinc-200/60 transition-colors"
                title="Reset stopwatch"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Log Workout (Save) Button */}
          {secondsElapsed > 0 && (
            <button
              onClick={handleSaveWorkout}
              id="btn-timer-log-completed"
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              Save Workout ({Math.max(1, Math.round(secondsElapsed / 60))} Min)
            </button>
          )}
        </div>
      </div>

      {/* Floating Sound Toggle */}
      <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
        <span>Session chime: <strong>{soundEnabled ? 'On' : 'Muted'}</strong></span>
        <button
          onClick={onToggleSound}
          id="btn-toggle-sound-timer"
          className="flex items-center gap-1 hover:text-zinc-800 transition-colors bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 rounded-md"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {soundEnabled ? 'Mute' : 'Unmute'}
        </button>
      </div>
    </div>
  );
};
