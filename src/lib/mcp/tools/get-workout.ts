import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, ok, fail, round } from "../shared";

export default defineTool({
  name: "get_workout",
  title: "Get workout",
  description:
    "Use when you need every detail of one training session: exercises with muscle groups, all sets with weight, reps, warmup flag and RPE, cardio data, plus target values when the session came from a plan. Get the id from list_workouts.",
  inputSchema: {
    workout_id: z.string().describe("The workout session id from list_workouts."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workout_id }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const { data, error } = await db
        .from("workout_sessions")
        .select(
          `id, workout_type, custom_type_name, title, status, planned_date, source, started_at, ended_at,
           duration_seconds, rating, notes,
           workout_exercises (
             id, order_index, superset_group, notes, is_completed,
             target_sets, target_reps, target_weight_kg,
             exercises ( id, name, muscle_groups, equipment_type, is_cardio ),
             exercise_sets ( id, set_number, weight_kg, reps, is_warmup, is_bodyweight, rpe, rir, notes, completed_at ),
             cardio_logs ( cardio_type, duration_seconds, distance_km, calories, avg_heart_rate, max_heart_rate, pace_sec_per_km, notes )
           )`,
        )
        .eq("id", workout_id)
        .maybeSingle();

      if (error) return fail(error.message);
      if (!data) return fail("Workout not found or not accessible.", { workout_id });

      const w = data as Record<string, any>;
      const exercises = ((w.workout_exercises ?? []) as any[])
        .sort((a, b) => a.order_index - b.order_index)
        .map((we) => {
          const ex = we.exercises;
          const sets = ((we.exercise_sets ?? []) as any[]).sort(
            (a, b) => a.set_number - b.set_number,
          );
          const working = sets.filter((s) => !s.is_warmup);
          return {
            id: we.id,
            exercise_id: ex?.id,
            name: ex?.name,
            muscle_groups: ex?.muscle_groups ?? [],
            equipment: ex?.equipment_type,
            is_cardio: ex?.is_cardio ?? false,
            superset_group: we.superset_group,
            is_completed: we.is_completed,
            notes: we.notes,
            target:
              we.target_sets || we.target_reps || we.target_weight_kg
                ? {
                    sets: we.target_sets,
                    reps: we.target_reps,
                    weight_kg: we.target_weight_kg,
                  }
                : null,
            sets: sets.map((s) => ({
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              is_warmup: s.is_warmup,
              is_bodyweight: s.is_bodyweight,
              rpe: s.rpe,
              rir: s.rir,
              notes: s.notes,
              completed_at: s.completed_at,
            })),
            volume_kg: round(
              working.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0),
            ),
            cardio: ((we.cardio_logs ?? []) as any[])[0] ?? null,
          };
        });

      return ok({
        id: w.id,
        title: w.title ?? w.custom_type_name ?? null,
        type: w.workout_type,
        status: w.status,
        source: w.source,
        planned_date: w.planned_date,
        started_at: w.started_at,
        ended_at: w.ended_at,
        duration_minutes:
          w.duration_seconds != null ? Math.round(w.duration_seconds / 60) : null,
        rating: w.rating,
        notes: w.notes,
        total_volume_kg: round(exercises.reduce((s, e) => s + e.volume_kg, 0)),
        exercises,
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
