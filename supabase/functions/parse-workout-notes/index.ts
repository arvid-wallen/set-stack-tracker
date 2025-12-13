import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.warn('Unauthorized access attempt:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input size validation to prevent API abuse
    const MAX_TEXT_LENGTH = 100000; // ~25k tokens for GPT
    if (text.length > MAX_TEXT_LENGTH) {
      console.warn(`Text too long: ${text.length} characters (max: ${MAX_TEXT_LENGTH})`);
      return new Response(
        JSON.stringify({ 
          error: `Texten är för lång (${Math.round(text.length / 1000)}k tecken). Dela upp i mindre delar och importera separat.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing workout notes: ${text.length} characters`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI API key not configured' }),
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

    console.log('Calling Lovable AI Gateway to parse workout notes...');
    
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
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'För många förfrågningar. Vänta en stund och försök igen.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-krediter slut. Kontakta support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'Failed to parse workout notes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OpenAI response content:', content);

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
      console.error('Failed to parse JSON from OpenAI response:', parseError);
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
