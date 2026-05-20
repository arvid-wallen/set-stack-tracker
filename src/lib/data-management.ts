import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Export ALL user data as a single JSON file (workouts, sets, cardio, exercises,
 * routines, notes, goals, photos, PT profile, chat, profile).
 */
export async function exportAllDataAsJSON(userId: string): Promise<void> {
  const [
    profile,
    ptProfile,
    workoutSessions,
    workoutExercises,
    exerciseSets,
    cardioLogs,
    exercises,
    routines,
    routineExercises,
    exerciseGoals,
    exerciseNotes,
    progressPhotos,
    ptChatMessages,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('pt_profiles').select('*').eq('user_id', userId),
    supabase.from('workout_sessions').select('*').eq('user_id', userId),
    supabase.from('workout_exercises').select('*, workout_sessions!inner(user_id)').eq('workout_sessions.user_id', userId),
    supabase.from('exercise_sets').select('*, workout_exercises!inner(workout_sessions!inner(user_id))').eq('workout_exercises.workout_sessions.user_id', userId),
    supabase.from('cardio_logs').select('*, workout_exercises!inner(workout_sessions!inner(user_id))').eq('workout_exercises.workout_sessions.user_id', userId),
    supabase.from('exercises').select('*').eq('user_id', userId),
    supabase.from('routines').select('*').eq('user_id', userId),
    supabase.from('routine_exercises').select('*, routines!inner(user_id)').eq('routines.user_id', userId),
    supabase.from('exercise_goals').select('*').eq('user_id', userId),
    supabase.from('exercise_notes').select('*').eq('user_id', userId),
    supabase.from('progress_photos').select('*').eq('user_id', userId),
    supabase.from('pt_chat_messages').select('*').eq('user_id', userId),
  ]);

  const payload = {
    export_version: 1,
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profile.data,
    pt_profile: ptProfile.data,
    workout_sessions: workoutSessions.data,
    workout_exercises: workoutExercises.data,
    exercise_sets: exerciseSets.data,
    cardio_logs: cardioLogs.data,
    custom_exercises: exercises.data,
    routines: routines.data,
    routine_exercises: routineExercises.data,
    exercise_goals: exerciseGoals.data,
    exercise_notes: exerciseNotes.data,
    progress_photos: progressPhotos.data,
    pt_chat_messages: ptChatMessages.data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `haus-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Delete ALL training data for the user (workouts, exercises, routines, goals,
 * notes, photos, PT chat, PT profile). Keeps the profile row + auth account.
 * Order matters because FKs are not declared.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  // 1. Fetch session ids to chain deletes
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId);
  const sessionIds = (sessions || []).map((s) => s.id);

  if (sessionIds.length > 0) {
    const { data: wes } = await supabase
      .from('workout_exercises')
      .select('id')
      .in('workout_session_id', sessionIds);
    const weIds = (wes || []).map((w) => w.id);

    if (weIds.length > 0) {
      await supabase.from('exercise_sets').delete().in('workout_exercise_id', weIds);
      await supabase.from('cardio_logs').delete().in('workout_exercise_id', weIds);
      await supabase.from('workout_exercises').delete().in('id', weIds);
    }
    await supabase.from('workout_sessions').delete().in('id', sessionIds);
  }

  // 2. Routines
  const { data: routines } = await supabase
    .from('routines')
    .select('id')
    .eq('user_id', userId);
  const routineIds = (routines || []).map((r) => r.id);
  if (routineIds.length > 0) {
    await supabase.from('routine_exercises').delete().in('routine_id', routineIds);
    await supabase.from('routines').delete().in('id', routineIds);
  }

  // 3. Progress photos (storage + db)
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('photo_url')
    .eq('user_id', userId);
  if (photos && photos.length > 0) {
    const paths = photos
      .map((p) => {
        const m = p.photo_url.match(/progress-photos\/(.+)$/);
        return m ? m[1] : null;
      })
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from('progress-photos').remove(paths);
    }
  }
  await supabase.from('progress_photos').delete().eq('user_id', userId);

  // 4. Other user-scoped rows
  await Promise.all([
    supabase.from('exercise_goals').delete().eq('user_id', userId),
    supabase.from('exercise_notes').delete().eq('user_id', userId),
    supabase.from('pt_chat_messages').delete().eq('user_id', userId),
    supabase.from('pt_profiles').delete().eq('user_id', userId),
    supabase.from('exercises').delete().eq('user_id', userId).eq('is_custom', true),
  ]);

  // Try to clean local caches
  try {
    localStorage.removeItem('active-workout');
    localStorage.removeItem('workout-cache');
  } catch {
    // ignore
  }
}
