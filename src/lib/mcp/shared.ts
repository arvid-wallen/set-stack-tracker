import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

export type Db = ReturnType<typeof supabaseForUser>;

export function requireUser(ctx: ToolContext): { db: Db; userId: string } {
  if (!ctx.isAuthenticated()) {
    throw new Error("Not authenticated. Connect this MCP server with OAuth first.");
  }
  const userId = ctx.getUserId();
  if (!userId) throw new Error("Could not resolve the signed-in user from the token.");
  return { db: supabaseForUser(ctx), userId };
}

export function ok(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    structuredContent: payload as Record<string, unknown>,
  };
}

export function fail(message: string, extra?: Record<string, unknown>) {
  const payload = { error: message, ...extra };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    isError: true as const,
  };
}

/** ISO date (YYYY-MM-DD) helpers. All timestamps are returned as ISO 8601 with offset. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return isoDate(d);
}

export function startOfDayIso(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}

/** Epley 1RM estimate. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (!weightKg || !reps || reps <= 0) return 0;
  if (reps === 1) return round(weightKg);
  return round(weightKg * (1 + reps / 30));
}

export function round(n: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

function similarity(a: string, b: string): number {
  const n1 = normalizeName(a);
  const n2 = normalizeName(b);
  if (n1 === n2) return 1;
  if (n1.includes(n2) || n2.includes(n1)) return 0.9;
  const w1 = n1.split(" ");
  const w2 = n2.split(" ");
  const common = w1.filter((w) => w2.some((o) => o.includes(w) || w.includes(o)));
  return (common.length / Math.max(w1.length, w2.length)) * 0.8;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ResolvedExercise {
  id: string;
  name: string;
  is_cardio: boolean;
  muscle_groups: string[];
}

/**
 * Resolves an exercise by id, canonical name, or stored alias.
 * Returns suggestions instead of guessing when nothing matches well.
 */
export async function resolveExercise(
  db: Db,
  input: string,
): Promise<
  | { exercise: ResolvedExercise; suggestions?: never }
  | { exercise: null; suggestions: Array<{ id: string; name: string }> }
> {
  const { data: exercises } = await db
    .from("exercises")
    .select("id, name, is_cardio, muscle_groups");
  const list = (exercises ?? []) as ResolvedExercise[];

  if (UUID_RE.test(input.trim())) {
    const byId = list.find((e) => e.id === input.trim());
    if (byId) return { exercise: byId };
  }

  const normalized = normalizeName(input);

  const exact = list.find((e) => normalizeName(e.name) === normalized);
  if (exact) return { exercise: exact };

  const { data: aliases } = await db
    .from("exercise_aliases")
    .select("exercise_id, alias");
  const aliasHit = (aliases ?? []).find(
    (a: { alias: string }) => normalizeName(a.alias) === normalized,
  ) as { exercise_id: string } | undefined;
  if (aliasHit) {
    const byAlias = list.find((e) => e.id === aliasHit.exercise_id);
    if (byAlias) return { exercise: byAlias };
  }

  const scored = list
    .map((e) => ({ e, score: similarity(e.name, input) }))
    .sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score >= 0.85) return { exercise: scored[0].e };

  return {
    exercise: null,
    suggestions: scored
      .filter((s) => s.score > 0.3)
      .slice(0, 5)
      .map((s) => ({ id: s.e.id, name: s.e.name })),
  };
}

export const WORKOUT_TYPES = [
  "push",
  "pull",
  "legs",
  "full_body",
  "cardio",
  "upper",
  "lower",
  "custom",
] as const;
