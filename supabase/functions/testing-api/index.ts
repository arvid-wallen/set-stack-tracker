import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-test-api-key',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const id = url.searchParams.get('id')

    console.log(`Testing API called: method=${req.method}, action=${action}, id=${id}`)

    // Handle GET requests
    if (req.method === 'GET') {
      switch (action) {
        case 'health': {
          return new Response(
            JSON.stringify({ 
              status: 'ok', 
              timestamp: new Date().toISOString(),
              version: '1.0.0'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'exercises': {
          if (id) {
            const { data, error } = await supabase
              .from('exercises')
              .select('*')
              .eq('id', id)
              .single()
            
            if (error) throw error
            return new Response(
              JSON.stringify({ data }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          const limit = parseInt(url.searchParams.get('limit') || '100')
          const offset = parseInt(url.searchParams.get('offset') || '0')
          const muscleGroup = url.searchParams.get('muscle_group')
          const isCardio = url.searchParams.get('is_cardio')
          
          let query = supabase.from('exercises').select('*', { count: 'exact' })
          
          if (muscleGroup) {
            query = query.contains('muscle_groups', [muscleGroup])
          }
          if (isCardio !== null) {
            query = query.eq('is_cardio', isCardio === 'true')
          }
          
          const { data, error, count } = await query.range(offset, offset + limit - 1)
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data, count, limit, offset }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'workout-sessions': {
          if (id) {
            const { data, error } = await supabase
              .from('workout_sessions')
              .select(`
                *,
                workout_exercises (
                  *,
                  exercises (*),
                  exercise_sets (*),
                  cardio_logs (*)
                )
              `)
              .eq('id', id)
              .single()
            
            if (error) throw error
            return new Response(
              JSON.stringify({ data }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          const userId = url.searchParams.get('user_id')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')
          
          let query = supabase
            .from('workout_sessions')
            .select('*', { count: 'exact' })
            .order('started_at', { ascending: false })
          
          if (userId) {
            query = query.eq('user_id', userId)
          }
          
          const { data, error, count } = await query.range(offset, offset + limit - 1)
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data, count, limit, offset }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'profiles': {
          if (id) {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', id)
              .single()
            
            if (error) throw error
            return new Response(
              JSON.stringify({ data }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          const { data, error } = await supabase.from('profiles').select('*')
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'routines': {
          const userId = url.searchParams.get('user_id')
          
          let query = supabase
            .from('routines')
            .select(`
              *,
              routine_exercises (
                *,
                exercises (*)
              )
            `)
          
          if (userId) {
            query = query.eq('user_id', userId)
          }
          
          const { data, error } = await query
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'exercise-goals': {
          const userId = url.searchParams.get('user_id')
          
          let query = supabase
            .from('exercise_goals')
            .select(`
              *,
              exercises (*)
            `)
          
          if (userId) {
            query = query.eq('user_id', userId)
          }
          
          const { data, error } = await query
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        default:
          return new Response(
            JSON.stringify({ 
              error: 'Unknown action',
              available_actions: [
                'health',
                'exercises',
                'workout-sessions',
                'profiles',
                'routines',
                'exercise-goals'
              ]
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    // Handle POST requests
    if (req.method === 'POST') {
      const body = await req.json()
      const postAction = body.action || action

      console.log(`POST action: ${postAction}`, JSON.stringify(body.data || {}))

      switch (postAction) {
        case 'create_exercise': {
          const { data, error } = await supabase
            .from('exercises')
            .insert({
              name: body.data.name,
              description: body.data.description || null,
              muscle_groups: body.data.muscle_groups || [],
              equipment_type: body.data.equipment_type || 'bodyweight',
              is_cardio: body.data.is_cardio || false,
              is_custom: true,
              user_id: body.data.user_id || null
            })
            .select()
            .single()
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data, message: 'Exercise created successfully' }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'create_workout_session': {
          const { data: session, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
              user_id: body.data.user_id,
              workout_type: body.data.workout_type || 'custom',
              custom_type_name: body.data.custom_type_name || null,
              notes: body.data.notes || null,
              is_active: body.data.is_active ?? true,
              started_at: body.data.started_at || new Date().toISOString()
            })
            .select()
            .single()
          
          if (sessionError) throw sessionError

          // If exercises are provided, add them to the session
          if (body.data.exercises && Array.isArray(body.data.exercises)) {
            for (let i = 0; i < body.data.exercises.length; i++) {
              const exercise = body.data.exercises[i]
              
              const { data: workoutExercise, error: weError } = await supabase
                .from('workout_exercises')
                .insert({
                  workout_session_id: session.id,
                  exercise_id: exercise.exercise_id,
                  order_index: i,
                  notes: exercise.notes || null
                })
                .select()
                .single()
              
              if (weError) throw weError

              // Add sets if provided
              if (exercise.sets && Array.isArray(exercise.sets)) {
                for (let j = 0; j < exercise.sets.length; j++) {
                  const set = exercise.sets[j]
                  await supabase.from('exercise_sets').insert({
                    workout_exercise_id: workoutExercise.id,
                    set_number: j + 1,
                    weight_kg: set.weight_kg || null,
                    reps: set.reps || null,
                    is_warmup: set.is_warmup || false,
                    is_bodyweight: set.is_bodyweight || false
                  })
                }
              }
            }
          }

          // Fetch the complete session with exercises
          const { data: completeSession, error: fetchError } = await supabase
            .from('workout_sessions')
            .select(`
              *,
              workout_exercises (
                *,
                exercises (*),
                exercise_sets (*)
              )
            `)
            .eq('id', session.id)
            .single()
          
          if (fetchError) throw fetchError
          
          return new Response(
            JSON.stringify({ data: completeSession, message: 'Workout session created successfully' }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'end_workout_session': {
          const { data, error } = await supabase
            .from('workout_sessions')
            .update({
              is_active: false,
              ended_at: new Date().toISOString(),
              duration_seconds: body.data.duration_seconds || null,
              rating: body.data.rating || null,
              notes: body.data.notes || null
            })
            .eq('id', body.data.session_id)
            .select()
            .single()
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data, message: 'Workout session ended successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'create_routine': {
          const { data: routine, error: routineError } = await supabase
            .from('routines')
            .insert({
              user_id: body.data.user_id,
              name: body.data.name,
              description: body.data.description || null,
              workout_type: body.data.workout_type || 'custom',
              folder: body.data.folder || null,
              is_favorite: body.data.is_favorite || false
            })
            .select()
            .single()
          
          if (routineError) throw routineError

          // Add exercises to the routine
          if (body.data.exercises && Array.isArray(body.data.exercises)) {
            for (let i = 0; i < body.data.exercises.length; i++) {
              const exercise = body.data.exercises[i]
              await supabase.from('routine_exercises').insert({
                routine_id: routine.id,
                exercise_id: exercise.exercise_id,
                order_index: i,
                default_sets: exercise.default_sets || 3,
                default_reps: exercise.default_reps || 10,
                default_weight_kg: exercise.default_weight_kg || null
              })
            }
          }

          const { data: completeRoutine, error: fetchError } = await supabase
            .from('routines')
            .select(`
              *,
              routine_exercises (
                *,
                exercises (*)
              )
            `)
            .eq('id', routine.id)
            .single()
          
          if (fetchError) throw fetchError
          
          return new Response(
            JSON.stringify({ data: completeRoutine, message: 'Routine created successfully' }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'create_exercise_goal': {
          const { data, error } = await supabase
            .from('exercise_goals')
            .insert({
              user_id: body.data.user_id,
              exercise_id: body.data.exercise_id,
              target_weight_kg: body.data.target_weight_kg || null,
              target_reps: body.data.target_reps || null,
              target_date: body.data.target_date || null,
              notes: body.data.notes || null
            })
            .select()
            .single()
          
          if (error) throw error
          return new Response(
            JSON.stringify({ data, message: 'Exercise goal created successfully' }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'reset_test_data': {
          // Delete test data in order (respecting foreign keys)
          const userId = body.data?.user_id

          if (userId) {
            console.log(`Resetting test data for user: ${userId}`)
            
            // Delete exercise goals
            await supabase.from('exercise_goals').delete().eq('user_id', userId)
            
            // Delete routines (cascade deletes routine_exercises)
            await supabase.from('routines').delete().eq('user_id', userId)
            
            // Get all workout sessions for user
            const { data: sessions } = await supabase
              .from('workout_sessions')
              .select('id')
              .eq('user_id', userId)
            
            if (sessions && sessions.length > 0) {
              const sessionIds = sessions.map(s => s.id)
              
              // Get workout exercises
              const { data: exercises } = await supabase
                .from('workout_exercises')
                .select('id')
                .in('workout_session_id', sessionIds)
              
              if (exercises && exercises.length > 0) {
                const exerciseIds = exercises.map(e => e.id)
                
                // Delete sets and cardio logs
                await supabase.from('exercise_sets').delete().in('workout_exercise_id', exerciseIds)
                await supabase.from('cardio_logs').delete().in('workout_exercise_id', exerciseIds)
              }
              
              // Delete workout exercises
              await supabase.from('workout_exercises').delete().in('workout_session_id', sessionIds)
              
              // Delete workout sessions
              await supabase.from('workout_sessions').delete().eq('user_id', userId)
            }
            
            // Delete custom exercises
            await supabase.from('exercises').delete().eq('user_id', userId).eq('is_custom', true)
            
            // Delete progress photos
            await supabase.from('progress_photos').delete().eq('user_id', userId)
            
            return new Response(
              JSON.stringify({ message: `Test data reset for user ${userId}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          return new Response(
            JSON.stringify({ error: 'user_id is required for reset_test_data' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        default:
          return new Response(
            JSON.stringify({ 
              error: 'Unknown action',
              available_actions: [
                'create_exercise',
                'create_workout_session',
                'end_workout_session',
                'create_routine',
                'create_exercise_goal',
                'reset_test_data'
              ]
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    // Handle DELETE requests
    if (req.method === 'DELETE') {
      const deleteAction = action

      switch (deleteAction) {
        case 'exercise': {
          if (!id) {
            return new Response(
              JSON.stringify({ error: 'id parameter is required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          const { error } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id)
            .eq('is_custom', true)
          
          if (error) throw error
          return new Response(
            JSON.stringify({ message: 'Exercise deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'workout-session': {
          if (!id) {
            return new Response(
              JSON.stringify({ error: 'id parameter is required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // Get workout exercises first
          const { data: exercises } = await supabase
            .from('workout_exercises')
            .select('id')
            .eq('workout_session_id', id)
          
          if (exercises && exercises.length > 0) {
            const exerciseIds = exercises.map(e => e.id)
            await supabase.from('exercise_sets').delete().in('workout_exercise_id', exerciseIds)
            await supabase.from('cardio_logs').delete().in('workout_exercise_id', exerciseIds)
          }
          
          await supabase.from('workout_exercises').delete().eq('workout_session_id', id)
          
          const { error } = await supabase
            .from('workout_sessions')
            .delete()
            .eq('id', id)
          
          if (error) throw error
          return new Response(
            JSON.stringify({ message: 'Workout session deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'routine': {
          if (!id) {
            return new Response(
              JSON.stringify({ error: 'id parameter is required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          await supabase.from('routine_exercises').delete().eq('routine_id', id)
          
          const { error } = await supabase
            .from('routines')
            .delete()
            .eq('id', id)
          
          if (error) throw error
          return new Response(
            JSON.stringify({ message: 'Routine deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        default:
          return new Response(
            JSON.stringify({ 
              error: 'Unknown action',
              available_actions: ['exercise', 'workout-session', 'routine']
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Testing API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorDetails = error && typeof error === 'object' && 'details' in error ? (error as { details: unknown }).details : null
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
