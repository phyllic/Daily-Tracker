export enum WorkoutType {
  INDOOR = 'Home Indoor',
  WALK_RUN = 'Walk / Run',
  BICYCLE = 'Bicycle Ride'
}

export interface WorkoutLog {
  id: string;
  type: WorkoutType;
  durationMinutes: number;
  timestamp: number; // milliseconds epoch
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD local date
  weight: number; // kg or lbs depending on user unit preference
  notes?: string;
}

export interface UserPreferences {
  defaultDurationMinutes: number; // e.g., 30
  soundEnabled: boolean;
  weightUnit: 'kg' | 'lbs';
}
