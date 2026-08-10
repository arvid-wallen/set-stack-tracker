import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, ok, fail } from "../shared";

export default defineTool({
  name: "delete_planned_workout",
  title: "Delete planned workout",
  description:
    "Use to remove a session that is still planned and has not been performed. Completed and active sessions can never be deleted through this server.",
  inputSchema: {
    workout_id: z.string().describe("Id of the planned workout to delete."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  handler: async ({ workout_id }, ctx) => {
    try {
      const { db } = requireUser(ctx);
      const { data: existing, error: readError } = await db
        .from("workout_sessions")
        .select("id, status")
        .eq("id", workout_id)
        .maybeSingle();
      if (readError) return fail(readError.message);
      if (!existing) return fail("Workout not found or not accessible.", { workout_id });
      if (existing.status !== "planned") {
        return fail(
          `Only planned workouts can be deleted. This one has status "${existing.status}".`,
        );
      }

      const { error } = await db
        .from("workout_sessions")
        .delete()
        .eq("id", workout_id)
        .eq("status", "planned");
      if (error) return fail(error.message);

      return ok({ workout_id, deleted: true });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
