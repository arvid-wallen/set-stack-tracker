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
5. GE SPECIFIKA VIKTFÖRSLAG baserat på användarens träningshistorik

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

// Types
interface UserProfile {
  goals?: string[];
  experience_level?: string;
  available_equipment?: string[];
  preferred_workout_duration?: number;
  training_days_per_week?: number;
  injuries?: string;
}

interface RecentWorkout {
  date: string;
  type: string;
  exerciseCount: number;
  duration: number;
  topExercise: string;
}

interface TopExercise {
  name: string;
  lastWeight: number;
  lastReps: number;
  personalRecord: number;
  timesPerformed: number;
  progressSuggestion: string;
}

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  date: string;
}

interface TrainingHistory {
  recentWorkouts: RecentWorkout[];
  topExercises: TopExercise[];
  personalRecords: PersonalRecord[];
}

// Map goal IDs to readable Swedish
const goalLabels: Record<string, string> = {
  muscle_gain: 'Bygga muskler',
  fat_loss: 'Gå ner i vikt',
  strength: 'Öka styrka',
  health: 'Allmän hälsa',
  endurance: 'Bättre kondition',
};

// Map experience levels to Swedish
const experienceLabels: Record<string, string> = {
  beginner: 'Nybörjare (0-1 år)',
  intermediate: 'Mellanliggande (1-3 år)',
  advanced: 'Avancerad (3+ år)',
};

// Map equipment to Swedish
const equipmentLabels: Record<string, string> = {
  full_gym: 'Komplett gym',
  home_gym: 'Hemmagym',
  bodyweight: 'Endast kroppsvikt',
  resistance_bands: 'Gummiband',
};

function buildPersonalContext(profile: UserProfile | null): string {
  if (!profile) return '';

  const parts: string[] = [];
  
  if (profile.goals && profile.goals.length > 0) {
    const goalNames = profile.goals.map(g => goalLabels[g] || g).join(', ');
    parts.push(`- Träningsmål: ${goalNames}`);
  }
  
  if (profile.experience_level) {
    parts.push(`- Erfarenhetsnivå: ${experienceLabels[profile.experience_level] || profile.experience_level}`);
  }
  
  if (profile.available_equipment && profile.available_equipment.length > 0) {
    const equipNames = profile.available_equipment.map(e => equipmentLabels[e] || e).join(', ');
    parts.push(`- Tillgänglig utrustning: ${equipNames}`);
  }
  
  if (profile.preferred_workout_duration) {
    parts.push(`- Önskad tid per pass: ${profile.preferred_workout_duration} minuter`);
  }
  
  if (profile.training_days_per_week) {
    parts.push(`- Träningsdagar per vecka: ${profile.training_days_per_week}`);
  }
  
  if (profile.injuries) {
    parts.push(`- Skador/begränsningar att ta hänsyn till: ${profile.injuries}`);
  }

  if (parts.length === 0) return '';

  return `

ANVÄNDARENS PROFIL:
${parts.join('\n')}

VIKTIGT: Anpassa ALLTID dina svar och träningsförslag efter denna profil:
- Välj övningar som passar användarens utrustning
- Anpassa volym och intensitet efter erfarenhetsnivå
- Undvik övningar som kan förvärra eventuella skador
- Håll pass inom önskad tidsram
- Fokusera på användarens primära mål`;
}

function buildTrainingContext(history: TrainingHistory | null): string {
  if (!history) return '';
  
  const hasData = 
    (history.recentWorkouts?.length > 0) || 
    (history.topExercises?.length > 0) || 
    (history.personalRecords?.length > 0);
  
  if (!hasData) return '';

  let context = '\n\nANVÄNDARENS TRÄNINGSHISTORIK:';
  
  // Recent workouts
  if (history.recentWorkouts?.length > 0) {
    context += '\n\nSenaste pass:';
    history.recentWorkouts.slice(0, 5).forEach(w => {
      context += `\n- ${w.date}: ${w.type} (${w.exerciseCount} övningar, ${w.duration} min)`;
      if (w.topExercise) context += ` - Tyngst: ${w.topExercise}`;
    });
  }
  
  // Top exercises with progression suggestions
  if (history.topExercises?.length > 0) {
    context += '\n\nMest tränade övningar med progressionsförslag:';
    history.topExercises.forEach(e => {
      context += `\n- ${e.name}: Senast ${e.lastWeight}kg × ${e.lastReps} reps, PR: ${e.personalRecord}kg (${e.timesPerformed} ggr)`;
      if (e.progressSuggestion) {
        context += ` → ${e.progressSuggestion}`;
      }
    });
  }
  
  // Personal records
  if (history.personalRecords?.length > 0) {
    context += '\n\nPersonliga rekord:';
    history.personalRecords.forEach(pr => {
      context += `\n- ${pr.exerciseName}: ${pr.weight}kg (${pr.date})`;
    });
  }
  
  context += `

VIKTIGT FÖR PROGRESSIV ÖVERBELASTNING:
- Använd träningshistoriken för att ge SPECIFIKA viktförslag
- När användaren klarar 10+ reps, föreslå ökning med 2.5kg
- Under 6 reps kan indikera för tung vikt
- Referera till deras personliga rekord för motivation
- Undvik övningar de nyligen tränat om de vill ha variation
- Anpassa volym baserat på deras vanliga träningsmönster`;
  
  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, hasActiveWorkout, userProfile, trainingHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build personal context from user profile
    const personalContext = buildPersonalContext(userProfile);
    
    // Build training history context
    const trainingContext = buildTrainingContext(trainingHistory);

    // Adjust system prompt based on workout state and user profile
    const workoutContext = hasActiveWorkout 
      ? `\n\nKONTEXT: Användaren har ett pågående pass. Du kan rekommendera övningar att lägga till med add_exercise-verktyget.`
      : `\n\nKONTEXT: Användaren har inget aktivt pass. Du kan skapa ett nytt pass med create_workout-verktyget.`;

    const contextPrompt = `${systemPrompt}${personalContext}${trainingContext}${workoutContext}`;

    console.log("PT Chat request - profile:", userProfile ? "yes" : "no", "- history:", trainingHistory?.topExercises?.length || 0, "exercises");

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
