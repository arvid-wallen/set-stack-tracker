import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, ok, fail, daysAgo, isoDate, round } from "../shared";

export default defineTool({
  name: "get_body_weight",
  title: "Get body weight",
  description:
    "Use when body weight matters for the coaching, for example bodyweight progression, cutting or bulking. Returns logged weights in kilograms for a date range, newest first, plus the change over the range.",
  inputSchema: {
    from: z.string().optional().describe("Start date, YYYY-MM-DD. Defaults to 180 days ago."),
    to: z.string().optional().describe("End date, YYYY-MM-DD. Defaults to today."),
    limit: z.number().int().optional().describe("Max entries, default 100, max 365."),
    cursor: z.string().optional().describe("Opaque cursor from a previous response."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, limit, cursor }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const fromDate = from ?? daysAgo(180);
      const toDate = to ?? isoDate(new Date());
      const pageSize = Math.min(Math.max(limit ?? 100, 1), 365);
      const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;

      const { data, error } = await db
        .from("body_weight_logs")
        .select("weight_kg, logged_at, notes")
        .gte("logged_at", fromDate)
        .lte("logged_at", toDate)
        .order("logged_at", { ascending: false })
        .range(offset, offset + pageSize);

      if (error) return fail(error.message);

      const rows = (data ?? []) as any[];
      const hasMore = rows.length > pageSize;
      const page = rows.slice(0, pageSize);
      const latest = page[0];
      const oldest = page[page.length - 1];

      return ok({
        range: { from: fromDate, to: toDate },
        unit: "kg",
        latest_kg: latest ? Number(latest.weight_kg) : null,
        change_kg:
          latest && oldest && page.length > 1
            ? round(Number(latest.weight_kg) - Number(oldest.weight_kg))
            : null,
        entries: page.map((r) => ({
          date: r.logged_at,
          weight_kg: Number(r.weight_kg),
          notes: r.notes,
        })),
        next_cursor: hasMore ? String(offset + pageSize) : null,
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
