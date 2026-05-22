
## Problem

I pass-vyn:
1. **Vikt/reps-fältet förifylls** automatiskt med förra setets värden (eller med `useProgressiveOverload`s `suggestedWeight`). Det stör flowet — man tappar var man var och måste rensa/skriva över.
2. Förslagsbannern (`ProgressiveOverloadSuggestion`) ovanför seten kommer från en lokal heuristik, inte från AI — och har ingen accept/neka-interaktion.

## Mål

- Vikt- och reps-fältet är **alltid tomt** för nytt set (utom om användaren själv klickat "Använd förslag").
- Förslaget visas som ett **separat kort** ovanför set-listan, med tydliga **Använd / Avfärda**-knappar.
- Förslaget genereras av **AI (Lovable AI Gateway, `google/gemini-3-flash-preview`)** baserat på faktisk historik, så det är genomtänkt — inte bara senaste värdet.

## Förändringar

### 1. Stoppa prefill i `SetRow` (src/components/workout/SetRow.tsx)
- Ta bort `useEffect` som skriver `setWeight`/`setReps` från `previousSet` när raden är ny.
- Behåll den lilla "Förra: 80kg × 8"-hinten ovanför inputfältet (rent informativt).
- Lägg till en imperativ ingång (via `ref` eller en ny prop `prefillValues?: {weight, reps}` + `prefillKey` som triggrar `useEffect`) så att förslagskortet kan fylla i värden när användaren accepterar.

### 2. Ta bort prefill-fallback i `ExerciseCard` (src/components/workout/ExerciseCard.tsx)
- `previousSetData` ska bara komma från det faktiska senaste setet i passet (`lastWorkingSet`). Ta bort fallback till `suggestion.suggestedWeight` så raden förblir tom om inget set finns ännu i passet.
- Skicka in en handler `onAcceptSuggestion({weight, reps})` som sätter `prefillKey++` och `prefillValues` på den nya `SetRow`.

### 3. Nytt komponent: `AISetSuggestionCard.tsx` (src/components/workout/)
Ersätter dagens `<ProgressiveOverloadSuggestion>` ovanför set-listan.

UI (visas bara för icke-cardio, inte completed, och bara när nästa set inte börjats skrivas):
```
┌─────────────────────────────────────────┐
│ ✨ AI-förslag nästa set                 │
│ 82.5 kg × 8 reps · RPE 8                │
│ "Förra passet klarade du 12 reps på     │
│  80 kg → dags att öka."                 │
│ [ Använd ]   [ Avfärda ]   [ ↻ ]        │
└─────────────────────────────────────────┘
```

Beteende:
- Vid mount: kör query mot ny edge function `suggest-next-set` (cacheas per `exerciseId` + `workout_session_id` i React Query, `staleTime: Infinity`).
- Loading: skelett, ingen blockering.
- Fel/no data: visa inget (eller subtilt "Inget förslag ännu").
- "Använd": anropar `onAccept(weight, reps)` → fyller `SetRow` via prefillKey-mekanismen. Kortet kollapsas till en liten "✓ Använt"-rad.
- "Avfärda": kortet kollapsas/försvinner för det här setet (state i komponent + `sessionStorage` per session+exerciseId så det inte poppar tillbaka).
- "↻": tvingar refetch (om man vill ha nytt förslag efter att ha loggat första setet).

### 4. Ny edge function: `supabase/functions/suggest-next-set/index.ts`
- Auth: läser JWT, hämtar user_id (verify_jwt = default).
- Input (POST JSON): `{ exercise_id, workout_session_id }`.
- Hämtar från DB:
  - Exercise-metadata (namn, muscle_groups, equipment).
  - Senaste ~10 avslutade passens set för denna övning (vikt, reps, rpe, datum, set-ordning, warmup-flagga).
  - Set som redan loggats i pågående pass för denna övning (för att kunna föreslå set #2, #3 osv.).
- Bygger prompt med systemmeddelande som beskriver progressive overload-principer (8-12-rep range, +2.5 kg när topprep nås, dela upp i mikro-cykler, deload vid plateau/decline, RPE 7-9 mål, hänsyn till om det är första setet eller fortsättning).
- Anropar Lovable AI (`google/gemini-3-flash-preview`) med **tool calling** för strukturerad output:
  ```json
  {
    "name": "suggest_set",
    "parameters": {
      "weight_kg": number,
      "reps": number,
      "rpe": number|null,
      "rationale": "kort svensk förklaring (max 140 tecken)",
      "confidence": "high"|"medium"|"low"
    }
  }
  ```
- Hanterar 429/402 och returnerar tydliga felmeddelanden (visas i toast).
- Returnerar JSON till klienten. Inga prompts på klientsidan.

### 5. Ny hook: `useAISetSuggestion(exerciseId, workoutSessionId)`
- `useQuery` som anropar edge function via `supabase.functions.invoke('suggest-next-set', { body })`.
- `staleTime: Infinity`, `gcTime: 1h`. Manuell `refetch` används av "↻"-knappen.
- Hanterar dismissal-state via `sessionStorage` key `dismissed-suggestion:${session}:${exercise}`.

### 6. Rensa
- Ta bort gamla `ProgressiveOverloadSuggestion`-användningen i `ExerciseCard.tsx` (gamla komponenten kan stå kvar för historik-sheet om den används där, annars markera deprecated).
- `useProgressiveOverload` är fortfarande användbar för historik-trend i andra vyer; behåll men sluta använda för set-prefill.

## Filer som ändras

- `src/components/workout/SetRow.tsx` (edit) — ta bort auto-prefill, lägg till `prefillValues`+`prefillKey` prop.
- `src/components/workout/ExerciseCard.tsx` (edit) — koppla AI-suggestion-kort + ta bort fallback-prefill.
- `src/components/workout/AISetSuggestionCard.tsx` (new).
- `src/hooks/useAISetSuggestion.ts` (new).
- `supabase/functions/suggest-next-set/index.ts` (new).

Inga DB-migrationer behövs.

## Tekniska detaljer

- Modell: `google/gemini-3-flash-preview` (snabb, billig, räcker för denna uppgift).
- Tool calling istället för JSON-output för robust parsing.
- React Query-cache hindrar att förslaget genereras om vid varje render.
- `sessionStorage` (inte localStorage) → dismissal nollställs i nästa pass.
- All svensk copy, kg-enheter (matchar projektets core-regler).
