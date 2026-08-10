import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, ok, fail, normalizeName } from "../shared";

export default defineTool({
  name: "list_exercises",
  title: "List exercises",
  description:
    "Use before planning a workout to see which exercises exist, with their canonical ids, names, aliases, muscle groups and equipment. Always plan with names from this catalog so no duplicate exercises are created.",
  inputSchema: {
    search: z.string().optional().describe("Optional free-text filter on name or alias."),
    muscle_group: z.string().optional().describe("Filter by muscle group, e.g. 'chest'."),
    is_cardio: z.boolean().optional().describe("Only cardio (true) or only strength (false)."),
    limit: z.number().int().optional().describe("Max results, default 100, max 300."),
    cursor: z.string().optional().describe("Opaque cursor from a previous response."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, muscle_group, is_cardio, limit, cursor }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const pageSize = Math.min(Math.max(limit ?? 100, 1), 300);
      const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;

      const [{ data: exercises, error }, { data: aliases }] = await Promise.all([
        db
          .from("exercises")
          .select("id, name, description, muscle_groups, equipment_type, is_cardio, is_custom")
          .order("name"),
        db.from("exercise_aliases").select("exercise_id, alias"),
      ]);
      if (error) return fail(error.message);

      const aliasMap = new Map<string, string[]>();
      for (const a of (aliases ?? []) as any[]) {
        const arr = aliasMap.get(a.exercise_id) ?? [];
        arr.push(a.alias);
        aliasMap.set(a.exercise_id, arr);
      }

      let list = ((exercises ?? []) as any[]).map((e) => ({
        id: e.id,
        name: e.name,
        aliases: aliasMap.get(e.id) ?? [],
        muscle_groups: e.muscle_groups ?? [],
        equipment: e.equipment_type,
        is_cardio: e.is_cardio,
        is_custom: e.is_custom,
      }));

      if (typeof is_cardio === "boolean") list = list.filter((e) => e.is_cardio === is_cardio);
      if (muscle_group) {
        const mg = muscle_group.toLowerCase();
        list = list.filter((e) => e.muscle_groups.some((m: string) => m.toLowerCase() === mg));
      }
      if (search) {
        const q = normalizeName(search);
        list = list.filter(
          (e) =>
            normalizeName(e.name).includes(q) ||
            e.aliases.some((a: string) => normalizeName(a).includes(q)),
        );
      }

      return ok({
        total: list.length,
        exercises: list.slice(offset, offset + pageSize),
        next_cursor: offset + pageSize < list.length ? String(offset + pageSize) : null,
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
