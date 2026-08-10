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
  WORKOUT_TYPES,
} from "../shared";

export default defineTool({
  name: "list_workouts",
  title: "List workouts",
  description:
    "Use when you need an overview of the user's training sessions in a date range, for example 'what did I train last week'. Returns compact summaries (id, date, type, duration, status, exercise names), newest first. Defaults to the last 4 weeks. Use get_workout for the full set-by-set detail of a single session.",
  inputSchema: {
    from: z.string().optional().describe("Start date, YYYY-MM-DD. Defaults to 28 days ago."),
    to: z.string().optional().describe("End date, YYYY-MM-DD. Defaults to today."),
    type: z
      .enum(WORKOUT_TYPES)
      .optional()
      .describe("Filter by workout type."),
    status: z
      .enum(["planned", "active", "completed", "any"])
      .optional()
      .describe("Filter by status. Defaults to 'completed'. Use 'planned' to see upcoming planned sessions."),
    limit: z.number().int().optional().describe("Max results, default 20, max 100."),
    cursor: z.string().optional().describe("Opaque cursor from a previous response's next_cursor."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, type, status, limit, cursor }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const fromDate = from ?? daysAgo(28);
      const toDate = to ?? isoDate(new Date());
      const pageSize = Math.min(Math.max(limit ?? 20, 1), 100);
      const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
      const effectiveStatus = status ?? "completed";

      let query = db
        .from("workout_sessions")
        .select(
          "id, workout_type, custom_type_name, title, status, planned_date, source, started_at, ended_at, duration_seconds, rating, notes, workout_exercises(order_index, exercises(name))",
        )
        .gte("started_at", startOfDayIso(fromDate))
        .lte("started_at", endOfDayIso(toDate))
        .order("started_at", { ascending: false })
        .range(offset, offset + pageSize);

      if (type) query = query.eq("workout_type", type);
      if (effectiveStatus !== "any") query = query.eq("status", effectiveStatus);

      const { data, error } = await query;
      if (error) return fail(error.message);

      const rows = data ?? [];
      const hasMore = rows.length > pageSize;
      const page = rows.slice(0, pageSize);

      return ok({
        range: { from: fromDate, to: toDate },
        status: effectiveStatus,
        workouts: page.map((w) => ({
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
          exercises: ((w.workout_exercises ?? []) as unknown as Array<{
            order_index: number;
            exercises: { name: string } | null;
          }>)
            .sort((a, b) => a.order_index - b.order_index)
            .map((we) => we.exercises?.name)
            .filter(Boolean),
        })),
        next_cursor: hasMore ? String(offset + pageSize) : null,
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
