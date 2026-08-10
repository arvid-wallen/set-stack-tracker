import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  requireUser,
  ok,
  fail,
  daysAgo,
  isoDate,
  startOfDayIso,
  endOfDayIso,
  estimate1RM,
  resolveExercise,
  round,
} from "../shared";

export default defineTool({
  name: "get_exercise_history",
  title: "Get exercise history",
  description:
    "Use when you need the progression for a single exercise over time, for example 'how has my squat developed'. Returns one entry per training day with the working sets and the best estimated 1RM that day. Cardio exercises return duration, distance, pace and heart rate instead of weight and reps. Names are alias-resolved, so 'db curl' and 'Dumbbell Curl' hit the same exercise.",
  inputSchema: {
    exercise: z.string().describe("Exercise id or name (aliases are resolved)."),
    from: z.string().optional().describe("Start date, YYYY-MM-DD. Defaults to 6 months ago."),
    to: z.string().optional().describe("End date, YYYY-MM-DD. Defaults to today."),
    include_warmups: z.boolean().optional().describe("Include warmup sets. Default false."),
    limit: z.number().int().optional().describe("Max training days, default 50, max 200."),
    cursor: z.string().optional().describe("Opaque cursor from a previous response."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ exercise, from, to, include_warmups, limit, cursor }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const resolved = await resolveExercise(db, exercise);
      if (!resolved.exercise) {
        return fail(
          `No exercise matches "${exercise}". Pick one of the suggestions or call list_exercises.`,
          { suggestions: resolved.suggestions },
        );
      }
      const ex = resolved.exercise;
      const fromDate = from ?? daysAgo(183);
      const toDate = to ?? isoDate(new Date());
      const pageSize = Math.min(Math.max(limit ?? 50, 1), 200);
      const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;

      const { data, error } = await db
        .from("workout_exercises")
        .select(
          `id,
           workout_sessions!inner ( id, started_at, status ),
           exercise_sets ( set_number, weight_kg, reps, is_warmup, is_bodyweight, rpe, rir ),
           cardio_logs ( cardio_type, duration_seconds, distance_km, calories, avg_heart_rate, max_heart_rate, pace_sec_per_km )`,
        )
        .eq("exercise_id", ex.id)
        .eq("workout_sessions.status", "completed")
        .gte("workout_sessions.started_at", startOfDayIso(fromDate))
        .lte("workout_sessions.started_at", endOfDayIso(toDate));

      if (error) return fail(error.message);

      const entries = ((data ?? []) as any[])
        .map((we) => {
          const session = we.workout_sessions;
          const allSets = ((we.exercise_sets ?? []) as any[]).sort(
            (a, b) => a.set_number - b.set_number,
          );
          const sets = include_warmups ? allSets : allSets.filter((s) => !s.is_warmup);
          const cardio = ((we.cardio_logs ?? []) as any[])[0] ?? null;

          if (ex.is_cardio) {
            return {
              workout_id: session.id,
              date: session.started_at,
              cardio: cardio
                ? {
                    type: cardio.cardio_type,
                    duration_minutes:
                      cardio.duration_seconds != null
                        ? round(cardio.duration_seconds / 60)
                        : null,
                    distance_km: cardio.distance_km,
                    calories: cardio.calories,
                    avg_heart_rate: cardio.avg_heart_rate,
                    max_heart_rate: cardio.max_heart_rate,
                    pace_sec_per_km: cardio.pace_sec_per_km,
                  }
                : null,
            };
          }

          const best = sets.reduce(
            (acc, s) => Math.max(acc, estimate1RM(s.weight_kg ?? 0, s.reps ?? 0)),
            0,
          );
          return {
            workout_id: session.id,
            date: session.started_at,
            sets: sets.map((s) => ({
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              is_warmup: s.is_warmup,
              is_bodyweight: s.is_bodyweight,
              rpe: s.rpe,
              rir: s.rir,
            })),
            top_weight_kg: sets.reduce((m, s) => Math.max(m, s.weight_kg ?? 0), 0) || null,
            volume_kg: round(
              sets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0),
            ),
            estimated_1rm_kg: best || null,
          };
        })
        .filter((e: any) => (ex.is_cardio ? e.cardio : e.sets.length > 0))
        .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

      const page = entries.slice(offset, offset + pageSize);

      return ok({
        exercise: {
          id: ex.id,
          name: ex.name,
          is_cardio: ex.is_cardio,
          muscle_groups: ex.muscle_groups,
        },
        range: { from: fromDate, to: toDate },
        include_warmups: !!include_warmups,
        entries: page,
        next_cursor: offset + pageSize < entries.length ? String(offset + pageSize) : null,
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
