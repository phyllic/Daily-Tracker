import { WorkoutType, WorkoutLog, UserPreferences } from './types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultDurationMinutes: 30,
  soundEnabled: true,
};

export const getMockHistory = (): WorkoutLog[] => {
  const history: WorkoutLog[] = [];
  const now = new Date();
  
  // Helper to get timestamp for X days ago at a specific hour
  const getPastDateMs = (daysAgo: number, hour: number = 10) => {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  };

  // 14 days ago - Walk / Run
  history.push({
    id: 'mock-1',
    type: WorkoutType.WALK_RUN,
    durationMinutes: 30,
    timestamp: getPastDateMs(14, 8),
    notes: 'Morning run around the neighborhood. Felt amazing and breezy!',
  });

  // 13 days ago - Home Indoor
  history.push({
    id: 'mock-2',
    type: WorkoutType.INDOOR,
    durationMinutes: 30,
    timestamp: getPastDateMs(13, 18),
    notes: 'Quick indoor bodyweight workout. Done before dinner!',
  });

  // 11 days ago - Bicycle Ride
  history.push({
    id: 'mock-3',
    type: WorkoutType.BICYCLE,
    durationMinutes: 35,
    timestamp: getPastDateMs(11, 16),
    notes: 'Slightly longer ride today. Visited the park route.',
  });

  // 10 days ago - Walk / Run
  history.push({
    id: 'mock-4',
    type: WorkoutType.WALK_RUN,
    durationMinutes: 30,
    timestamp: getPastDateMs(10, 9),
    notes: 'Walked at a brisk pace. Nice sunshine.',
  });

  // 9 days ago - Home Indoor
  history.push({
    id: 'mock-5',
    type: WorkoutType.INDOOR,
    durationMinutes: 30,
    timestamp: getPastDateMs(9, 19),
    notes: 'Standard 30-minute routine, kept my energy high.',
  });

  // 7 days ago - Bicycle Ride
  history.push({
    id: 'mock-6',
    type: WorkoutType.BICYCLE,
    durationMinutes: 30,
    timestamp: getPastDateMs(7, 10),
    notes: 'Rode around the lake loop.',
  });

  // 6 days ago - Walk / Run
  history.push({
    id: 'mock-7',
    type: WorkoutType.WALK_RUN,
    durationMinutes: 30,
    timestamp: getPastDateMs(6, 8),
    notes: 'Early jog, felt super productive afterwards!',
  });

  // 4 days ago - Home Indoor
  history.push({
    id: 'mock-8',
    type: WorkoutType.INDOOR,
    durationMinutes: 30,
    timestamp: getPastDateMs(4, 18),
    notes: 'Indoor high-intensity bodyweight stretches.',
  });

  // 3 days ago - Bicycle Ride
  history.push({
    id: 'mock-9',
    type: WorkoutType.BICYCLE,
    durationMinutes: 30,
    timestamp: getPastDateMs(3, 11),
    notes: 'Very smooth ride, great weather today.',
  });

  // 2 days ago - Walk / Run
  history.push({
    id: 'mock-10',
    type: WorkoutType.WALK_RUN,
    durationMinutes: 30,
    timestamp: getPastDateMs(2, 8),
    notes: 'Morning run, kept a steady 6-min/km pace.',
  });

  // Yesterday - Home Indoor
  history.push({
    id: 'mock-11',
    type: WorkoutType.INDOOR,
    durationMinutes: 30,
    timestamp: getPastDateMs(1, 17),
    notes: 'Completed indoor home workout, sweat a lot!',
  });

  // Today - Let's leave today unlogged or logged, but leaving it unlogged lets the user log or run the timer to test it!
  // To show off the streaks, let's keep yesterday logged so they have an active streak of at least 3 days if they log today!

  return history;
};
