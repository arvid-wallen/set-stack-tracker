import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, ok, fail, resolveExercise, WORKOUT_TYPES } from "../shared";

const exerciseInput = z.object({
  exercise: z.string().describe("Exercise name or id from list_exercises."),
  sets: z.number().int().optional().describe("Number of planned sets."),
  target_reps: z.string().optional().describe("Target reps as text, e.g. '5' or '8-10'."),
  target_weight_kg: z.number().optional().describe("Target working weight in kilograms."),
  target_rpe: z.number().min(6).max(10).optional().describe("Target RPE for the exercise, 6-10 (half steps allowed)."),
  notes: z.string().optional().describe("Short coaching note for this exercise."),
});

export default defineTool({
  name: "update_planned_workout",
  title: "Update planned workout",
  description:
    "Use to change a session that is still planned: its date, type, title, notes, or the full exercise list. Completed and active sessions cannot be modified. Passing 'exercises' replaces the whole planned exercise list.",
  inputSchema: {
    workout_id: z.string().describe("Id of the planned workout."),
    date: z.string().optional().describe("New planned date, YYYY-MM-DD."),
    workout_type: z.enum(WORKOUT_TYPES).optional().describe("New workout type."),
    title: z.string().optional().describe("New title."),
    notes: z.string().optional().describe("New session notes."),
    exercises: z
      .array(exerciseInput)
      .optional()
      .describe("Replaces the full planned exercise list when provided."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ workout_id, date, workout_type, title, notes, exercises }, ctx) => {
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
          `Only planned workouts can be updated. This one has status "${existing.status}".`,
        );
      }

      const patch: Record<string, unknown> = {};
      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("date must be YYYY-MM-DD.");
        patch.planned_date = date;
        patch.started_at = `${date}T12:00:00.000Z`;
      }
      if (workout_type) patch.workout_type = workout_type;
      if (title !== undefined) patch.title = title;
      if (notes !== undefined) patch.notes = notes;

      if (Object.keys(patch).length > 0) {
        const { error } = await db.from("workout_sessions").update(patch).eq("id", workout_id);
        if (error) return fail(error.message);
      }

      let exerciseCount: number | null = null;
      if (exercises) {
        const resolvedList: Array<{ id: string; input: z.infer<typeof exerciseInput> }> = [];
        for (const item of exercises) {
          const r = await resolveExercise(db, item.exercise);
          if (!r.exercise) {
            return fail(
              `No exercise matches "${item.exercise}". Use one of the suggestions or call list_exercises.`,
              { unresolved: item.exercise, suggestions: r.suggestions },
            );
          }
          resolvedList.push({ id: r.exercise.id, input: item });
        }

        await db.from("workout_exercises").delete().eq("workout_session_id", workout_id);

        if (resolvedList.length) {
          const { error } = await db.from("workout_exercises").insert(
            resolvedList.map((r, index) => ({
              workout_session_id: workout_id,
              exercise_id: r.id,
              order_index: index,
              target_sets: r.input.sets ?? null,
              target_reps: r.input.target_reps ?? null,
              target_weight_kg: r.input.target_weight_kg ?? null,
        target_rpe: r.input.target_rpe ?? null,
              notes: r.input.notes ?? null,
            })),
          );
          if (error) return fail(error.message);
        }
        exerciseCount = resolvedList.length;
      }

      return ok({ workout_id, updated: true, exercise_count: exerciseCount });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
