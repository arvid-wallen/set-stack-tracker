import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du är en professionell personlig tränare som svarar på svenska.

PERSONLIGHET:
- Saklig, tydlig och motiverande
- Ge konkreta, evidensbaserade svar
- Använd enkla termer, förklara tekniska begrepp vid behov
- Håll svaren koncisa men informativa

FUNKTIONER:
1. Svara på frågor om träning, teknik, nutrition, och återhämtning
2. Förklara övningar och inkludera YouTube-sökningar för teknikanvisningar
3. Skapa kompletta träningspass baserat på användarens mål
4. Rekommendera specifika övningar

NÄR DU SKAPAR ETT PASS:
Använd create_workout-verktyget med workout_type, name och en lista med övningar.

NÄR DU REKOMMENDERAR EN ÖVNING UNDER ETT PASS:
Använd add_exercise-verktyget med övningsnamn och föreslagna sets/reps.

YOUTUBE-LÄNKAR:
För teknikanvisningar, inkludera relevanta YouTube-sökningar i formatet:
[Se teknik för övningen](https://www.youtube.com/results?search_query=how+to+EXERCISE+form)

Ersätt EXERCISE med övningsnamnet.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_workout",
      description: "Skapar ett komplett träningspass som användaren kan starta direkt i appen",
      parameters: {
        type: "object",
        properties: {
          workout_type: {
            type: "string",
            enum: ["push", "pull", "legs", "full_body", "upper", "lower", "cardio", "custom"],
            description: "Typ av pass"
          },
          name: {
            type: "string",
            description: "Namn på passet, t.ex. 'Push Day A' eller 'Benpass'"
          },
          exercises: {
            type: "array",
            description: "Lista med övningar i passet",
            items: {
              type: "object",
              properties: {
                exercise_name: {
                  type: "string",
                  description: "Namn på övningen, använd vanliga gymtermer"
                },
                sets: {
                  type: "number",
                  description: "Antal set"
                },
                reps: {
                  type: "number",
                  description: "Antal reps per set"
                },
                notes: {
                  type: "string",
                  description: "Eventuella tips eller instruktioner"
                }
              },
              required: ["exercise_name", "sets", "reps"]
            }
          }
        },
        required: ["workout_type", "name", "exercises"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_exercise",
      description: "Rekommenderar en specifik övning att lägga till i pågående pass",
      parameters: {
        type: "object",
        properties: {
          exercise_name: {
            type: "string",
            description: "Namn på övningen"
          },
          sets: {
            type: "number",
            description: "Föreslaget antal set"
          },
          reps: {
            type: "number",
            description: "Föreslaget antal reps"
          },
          notes: {
            type: "string",
            description: "Tips för utförande"
          }
        },
        required: ["exercise_name"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, hasActiveWorkout } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Adjust system prompt based on workout state
    const contextPrompt = hasActiveWorkout 
      ? `${systemPrompt}\n\nKONTEXT: Användaren har ett pågående pass. Du kan rekommendera övningar att lägga till med add_exercise-verktyget.`
      : `${systemPrompt}\n\nKONTEXT: Användaren har inget aktivt pass. Du kan skapa ett nytt pass med create_workout-verktyget.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar. Vänta en stund och försök igen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-krediter slut. Kontakta support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI-tjänsten är tillfälligt otillgänglig" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("pt-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
