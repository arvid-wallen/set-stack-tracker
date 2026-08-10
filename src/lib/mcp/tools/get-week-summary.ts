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
  round,
} from "../shared";

/** ISO week key, e.g. 2026-W21 */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default defineTool({
  name: "get_week_summary",
  title: "Get weekly summary",
  description:
    "Use for a high-level training load overview: sessions, working sets and volume per muscle group, grouped by ISO week. Good for spotting neglected muscle groups or a drop in volume.",
  inputSchema: {
    from: z.string().optional().describe("Start date, YYYY-MM-DD. Defaults to 8 weeks ago."),
    to: z.string().optional().describe("End date, YYYY-MM-DD. Defaults to today."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const fromDate = from ?? daysAgo(56);
      const toDate = to ?? isoDate(new Date());

      const { data, error } = await db
        .from("workout_sessions")
        .select(
          `id, started_at, workout_type, duration_seconds,
           workout_exercises ( exercises ( muscle_groups, is_cardio ), exercise_sets ( weight_kg, reps, is_warmup ) )`,
        )
        .eq("status", "completed")
        .gte("started_at", startOfDayIso(fromDate))
        .lte("started_at", endOfDayIso(toDate))
        .order("started_at", { ascending: false });

      if (error) return fail(error.message);

      const weeks = new Map<
        string,
        {
          week: string;
          workouts: number;
          working_sets: number;
          duration_minutes: number;
          total_volume_kg: number;
          volume_by_muscle_kg: Record<string, number>;
        }
      >();

      for (const session of (data ?? []) as any[]) {
        const key = isoWeekKey(new Date(session.started_at));
        const bucket =
          weeks.get(key) ??
          {
            week: key,
            workouts: 0,
            working_sets: 0,
            duration_minutes: 0,
            total_volume_kg: 0,
            volume_by_muscle_kg: {} as Record<string, number>,
          };
        bucket.workouts += 1;
        bucket.duration_minutes += Math.round((session.duration_seconds ?? 0) / 60);

        for (const we of (session.workout_exercises ?? []) as any[]) {
          const muscles: string[] = we.exercises?.muscle_groups ?? [];
          for (const s of (we.exercise_sets ?? []) as any[]) {
            if (s.is_warmup) continue;
            bucket.working_sets += 1;
            const volume = (s.weight_kg ?? 0) * (s.reps ?? 0);
            bucket.total_volume_kg += volume;
            if (volume > 0 && muscles.length) {
              const share = volume / muscles.length;
              for (const m of muscles) {
                bucket.volume_by_muscle_kg[m] = (bucket.volume_by_muscle_kg[m] ?? 0) + share;
              }
            }
          }
        }
        weeks.set(key, bucket);
      }

      const result = [...weeks.values()]
        .map((w) => ({
          ...w,
          total_volume_kg: round(w.total_volume_kg),
          volume_by_muscle_kg: Object.fromEntries(
            Object.entries(w.volume_by_muscle_kg)
              .map(([k, v]) => [k, round(v)])
              .sort((a, b) => (b[1] as number) - (a[1] as number)),
          ),
        }))
        .sort((a, b) => (a.week < b.week ? 1 : -1));

      return ok({ range: { from: fromDate, to: toDate }, unit: "kg", weeks: result });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
