import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedWorkout {
  date: string;
  workoutType: string;
  exercises: {
    name: string;
    sets: {
      weight: number | null;
      reps: number | null;
      isWarmup: boolean;
    }[];
  }[];
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Du är en expert på att tolka träningsanteckningar. Din uppgift är att extrahera strukturerad data från användarens träningslogg.

Regler:
- Extrahera datum i format YYYY-MM-DD. Om inget år anges, anta 2024.
- Identifiera övningsnamn (t.ex. "Bänkpress", "Knäböj", "Marklyft")
- Extrahera vikt i kg och antal reps per set
- Markera uppvärmningsset om det framgår (t.ex. "uppv", "warmup", "lätt")
- Gissa workout_type baserat på övningarna: "push", "pull", "legs", "upper", "lower", "full_body", "cardio", "custom"
- Om flera pass finns i texten, returnera dem som separata objekt i arrayen

Returnera ENDAST giltig JSON i detta format:
{
  "workouts": [
    {
      "date": "YYYY-MM-DD",
      "workoutType": "push|pull|legs|upper|lower|full_body|cardio|custom",
      "exercises": [
        {
          "name": "Övningsnamn",
          "sets": [
            { "weight": 80, "reps": 8, "isWarmup": false }
          ]
        }
      ],
      "notes": "Eventuella anteckningar om passet"
    }
  ]
}`;

    console.log('Calling Lovable AI to parse workout notes...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Tolka följande träningsanteckningar och extrahera all data:\n\n${text}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to parse workout notes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response content:', content);

    // Extract JSON from the response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse JSON from AI response:', parseError);
      console.error('Content was:', jsonContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response as JSON', rawContent: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully parsed workouts:', parsedData);

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-workout-notes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
