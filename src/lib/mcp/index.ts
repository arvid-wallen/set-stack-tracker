import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWorkouts from "./tools/list-workouts";
import getWorkout from "./tools/get-workout";
import getExerciseHistory from "./tools/get-exercise-history";
import listExercises from "./tools/list-exercises";
import createPlannedWorkout from "./tools/create-planned-workout";
import updatePlannedWorkout from "./tools/update-planned-workout";
import deletePlannedWorkout from "./tools/delete-planned-workout";
import getBodyWeight from "./tools/get-body-weight";
import getWeekSummary from "./tools/get-week-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "gymbro3000",
  title: "GymBro3000",
  version: "0.1.0",
  instructions:
    "Tools for the GymBro3000 gym log. Read the user's real training data before giving advice: list_workouts for recent sessions, get_workout for full set-by-set detail, get_exercise_history for progression on one lift, get_week_summary for load per muscle group, get_body_weight for bodyweight trend. To program ahead, call list_exercises first and then create_planned_workout with names from that catalog; planned sessions can be changed with update_planned_workout and removed with delete_planned_workout. Completed sessions are read-only. All weights are kilograms, all timestamps ISO 8601.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listWorkouts,
    getWorkout,
    getExerciseHistory,
    listExercises,
    createPlannedWorkout,
    updatePlannedWorkout,
    deletePlannedWorkout,
    getBodyWeight,
    getWeekSummary,
  ],
});
