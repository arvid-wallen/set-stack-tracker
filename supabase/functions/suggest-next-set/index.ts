import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  exercise_id: string;
  workout_session_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.exercise_id || !body.workout_session_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exercise metadata
    const { data: exercise } = await supabase
      .from("exercises")
      .select("name, muscle_groups, equipment_type, is_cardio")
      .eq("id", body.exercise_id)
      .maybeSingle();

    if (!exercise || exercise.is_cardio) {
      return new Response(JSON.stringify({ suggestion: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Historical workout_exercises for this exercise (last 10 completed sessions)
    const { data: weList } = await supabase
      .from("workout_exercises")
      .select("id, workout_session_id, workout_sessions!inner(started_at, is_active)")
      .eq("exercise_id", body.exercise_id)
      .eq("workout_sessions.is_active", false)
      .order("workout_sessions(started_at)", { ascending: false })
      .limit(10);

    const historyWeIds = (weList ?? []).map((w: any) => w.id);

    // Sets for those
    const { data: historySets } = historyWeIds.length
      ? await supabase
          .from("exercise_sets")
          .select("workout_exercise_id, set_number, weight_kg, reps, rpe, is_warmup")
          .in("workout_exercise_id", historyWeIds)
          .order("set_number", { ascending: true })
      : { data: [] as any[] };

    const history = (weList ?? []).map((we: any) => {
      const sets = (historySets ?? []).filter((s: any) => s.workout_exercise_id === we.id);
      return {
        date: we.workout_sessions?.started_at,
        sets: sets.map((s: any) => ({
          set: s.set_number,
          weight_kg: s.weight_kg,
          reps: s.reps,
          rpe: s.rpe,
          warmup: s.is_warmup,
        })),
      };
    }).filter((h: any) => h.sets.length > 0);

    // Current session sets so far for this exercise
    const { data: currentWe } = await supabase
      .from("workout_exercises")
      .select("id")
      .eq("workout_session_id", body.workout_session_id)
      .eq("exercise_id", body.exercise_id)
      .maybeSingle();

    let currentSets: any[] = [];
    if (currentWe) {
      const { data: cs } = await supabase
        .from("exercise_sets")
        .select("set_number, weight_kg, reps, rpe, is_warmup")
        .eq("workout_exercise_id", currentWe.id)
        .order("set_number", { ascending: true });
      currentSets = (cs ?? []).map((s: any) => ({
        set: s.set_number,
        weight_kg: s.weight_kg,
        reps: s.reps,
        rpe: s.rpe,
        warmup: s.is_warmup,
      }));
    }

    const systemPrompt = `Du är en evidensbaserad styrkecoach. Du föreslår nästa arbetsset (vikt × reps) för en svensk användare. Tänk noga igenom:
- Progressive overload: öka vikt med 2.5 kg när topp-rep i målintervall (8-12) nås konsekvent.
- Plateau (samma vikt 3+ pass utan ökning av reps): föreslå +1-2 reps eller mikroökning.
- Decline / RPE 10 med fallande reps: föreslå deload (-10-15%).
- Första gången: föreslå konservativ startvikt baserat på liknande övningar; om okänt, returnera null.
- Om användaren redan loggat set i pågående pass: föreslå nästa set utifrån det (vanligtvis samma vikt, ev. färre reps om RPE hög).
- Avrunda vikt till närmaste 2.5 kg. Mål-RPE 7-9.
- Allt i kg.
Returnera ALLTID via tool 'suggest_set'. Håll rationale ≤ 140 tecken på svenska.`;

    const userPrompt = JSON.stringify({
      exercise: exercise.name,
      muscle_groups: exercise.muscle_groups,
      equipment: exercise.equipment_type,
      history_last_sessions: history,
      current_session_sets: currentSets,
      next_set_number: currentSets.filter((s) => !s.warmup).length + 1,
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_set",
              description: "Föreslå nästa arbetsset",
              parameters: {
                type: "object",
                properties: {
                  weight_kg: { type: "number", description: "Vikt i kg, eller 0 för bodyweight" },
                  reps: { type: "number", description: "Antal reps" },
                  rpe: { type: ["number", "null"], description: "Mål-RPE 6-10 eller null" },
                  rationale: { type: "string", description: "Kort förklaring på svenska, max 140 tecken" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["weight_kg", "reps", "rationale", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_set" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ suggestion: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify({
        suggestion: {
          weight_kg: args.weight_kg,
          reps: args.reps,
          rpe: args.rpe ?? null,
          rationale: args.rationale,
          confidence: args.confidence,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("suggest-next-set error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
