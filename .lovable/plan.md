## Mål
Gör PT-chatten tillgänglig under ett pågående pass och låt AI:n lägga till en rekommenderad övning i passet via en "Lägg till i pass"-knapp. Om övningen inte finns i biblioteket skapas den automatiskt som custom-övning med rätt muskelgruppstaggar och utrustning.

## Förändringar

### 1. Synlig chatt under pass (`src/components/pt/PTChatFAB.tsx`)
- Höj z-index på FAB-knappen och chatt-sheeten så de hamnar ovanpå `ActiveWorkout` (som ligger på `z-50`). FAB:en blir `z-[60]` så den syns som en flik i sidan även under passet.
- Sheeten öppnas över passet — användaren behåller kontexten och kan stänga den för att fortsätta logga set.

### 2. Smartare `add_exercise`-tool (`supabase/functions/pt-chat/index.ts`)
- Utöka tool-schemat för `add_exercise` med:
  - `muscle_groups`: array av enum (`chest, back, shoulders, biceps, triceps, forearms, quads, hamstrings, glutes, calves, core, full_body`)
  - `equipment_type`: enum (`barbell, dumbbell, machine, cable, bodyweight, kettlebell, bands, cardio_machine, other`)
  - `is_cardio`: boolean
  - `description`: kort beskrivning (valfri)
- Uppdatera systemprompten så att AI:n ALLTID fyller i muskelgrupper + utrustning när den rekommenderar en övning, och nämner att användaren kan klicka "Lägg till i pass".
- Förtydliga att när användaren frågar efter inspiration/rekommendation under ett pågående pass ska AI:n svara med kort motivering + anropa `add_exercise`.

### 3. Auto-skapa övning om den saknas (`src/hooks/usePTChat.ts`)
- Utöka `AddExerciseData` med `muscle_groups`, `equipment_type`, `is_cardio`, `description`.
- I `applyAction` för `add_exercise`:
  1. Försök matcha mot befintlig övning via `findBestExerciseMatch`.
  2. Om ingen träff: anropa `createCustomExercise` med AI:ns metadata (namn + muskelgrupper + utrustning). Lägg till resultatet i workout.
  3. Om träff: lägg till som idag.
- Visa toast som säger antingen "Tillagd i passet" eller "Skapad och tillagd i passet".
- Använd `useExercises().createCustomExercise` — den lägger automatiskt övningen i biblioteket med `is_custom: true` och rätt taggar.

### 4. UX i action-knappen (`src/components/pt/PTChatMessage.tsx`)
- Ändra knapptexten för `add_exercise` till **"Lägg till i pass"** (idag står det "Lägg till X"). Behåll övning + sets/reps som undertext.
- När `applied: true`: visa "Tillagd i passet ✓".
- Disabla knappen om inget aktivt pass finns och visa hint "Starta ett pass först".

## Tekniska detaljer
- Inga DB-ändringar krävs — `exercises`-tabellen stödjer redan custom-övningar med `muscle_groups[]` och `equipment_type`.
- `ActiveWorkout` lyssnar redan på workout_exercises-state via `useWorkout`, så nya övningar dyker upp direkt utan reload.
- `PTChatFAB` är redan global i `App.tsx` — vi behöver bara fixa z-index, inte mounta den separat i `ActiveWorkout`.

## Filer som ändras
- `src/components/pt/PTChatFAB.tsx` — z-index
- `src/components/pt/PTChatMessage.tsx` — knapptext
- `src/hooks/usePTChat.ts` — utökad `AddExerciseData`, fallback till `createCustomExercise`
- `supabase/functions/pt-chat/index.ts` — utökat tool-schema + prompt
