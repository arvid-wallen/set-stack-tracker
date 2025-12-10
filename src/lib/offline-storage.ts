import { WorkoutSession, WorkoutExercise } from '@/types/workout';

const WORKOUT_KEY = 'gym-tracker-active-workout';
const PENDING_ACTIONS_KEY = 'gym-tracker-pending-actions';

interface LocalWorkout {
  session: WorkoutSession;
  exercises: WorkoutExercise[];
  savedAt: string;
}

interface PendingAction {
  type: 'addSet' | 'deleteSet' | 'updateSet';
  data: any;
  timestamp: number;
}

// Save current workout state to localStorage
export function saveWorkoutToLocal(session: WorkoutSession, exercises: WorkoutExercise[]) {
  try {
    const data: LocalWorkout = {
      session,
      exercises,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(WORKOUT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save workout locally:', error);
  }
}

// Get locally saved workout
export function getLocalWorkout(): LocalWorkout | null {
  try {
    const data = localStorage.getItem(WORKOUT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get local workout:', error);
    return null;
  }
}

// Clear local workout data
export function clearLocalWorkout() {
  try {
    localStorage.removeItem(WORKOUT_KEY);
  } catch (error) {
    console.error('Failed to clear local workout:', error);
  }
}

// Queue action for later sync
export function queueAction(action: Omit<PendingAction, 'timestamp'>) {
  try {
    const actions = getPendingActions();
    actions.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('Failed to queue action:', error);
  }
}

// Get pending actions
export function getPendingActions(): PendingAction[] {
  try {
    const data = localStorage.getItem(PENDING_ACTIONS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get pending actions:', error);
    return [];
  }
}

// Clear pending actions
export function clearPendingActions() {
  try {
    localStorage.removeItem(PENDING_ACTIONS_KEY);
  } catch (error) {
    console.error('Failed to clear pending actions:', error);
  }
}

// Check if there are pending actions to sync
export function hasPendingSync(): boolean {
  return getPendingActions().length > 0;
}
