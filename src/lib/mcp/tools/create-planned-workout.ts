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
  name: "create_planned_workout",
  title: "Create planned workout",
  description:
    "Use to write a planned training session into the app for a future date, so the user can open and run it. Exercise names must resolve against the existing catalog; unknown names return an error with suggestions instead of creating duplicates. Always check list_exercises first.",
  inputSchema: {
    date: z.string().describe("Planned date, YYYY-MM-DD."),
    workout_type: z.enum(WORKOUT_TYPES).describe("Workout type."),
    title: z.string().optional().describe("Short session title, e.g. 'Ben med Tina'."),
    notes: z.string().optional().describe("Session-level notes for the user."),
    exercises: z.array(exerciseInput).describe("Planned exercises in order."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ date, workout_type, title, notes, exercises }, ctx) => {
    try {
      const { db, userId } = requireUser(ctx);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("date must be YYYY-MM-DD.");
      if (!exercises.length) return fail("At least one exercise is required.");

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

      const { data: session, error: sessionError } = await db
        .from("workout_sessions")
        .insert({
          user_id: userId,
          workout_type,
          title: title ?? null,
          notes: notes ?? null,
          status: "planned",
          source: "mcp",
          planned_date: date,
          is_active: false,
          started_at: `${date}T12:00:00.000Z`,
        })
        .select("id")
        .single();

      if (sessionError) return fail(sessionError.message);

      const rows = resolvedList.map((r, index) => ({
        workout_session_id: session.id,
        exercise_id: r.id,
        order_index: index,
        target_sets: r.input.sets ?? null,
        target_reps: r.input.target_reps ?? null,
        target_weight_kg: r.input.target_weight_kg ?? null,
        target_rpe: r.input.target_rpe ?? null,
        notes: r.input.notes ?? null,
      }));

      const { error: exError } = await db.from("workout_exercises").insert(rows);
      if (exError) {
        await db.from("workout_sessions").delete().eq("id", session.id);
        return fail(exError.message);
      }

      return ok({
        workout_id: session.id,
        status: "planned",
        date,
        workout_type,
        title: title ?? null,
        exercise_count: rows.length,
      });
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Unknown error");
    }
  },
});
