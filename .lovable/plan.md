## Mål
"Förslag idag" på startsidan ska följa användarens valda träningssplit och rotera genom den baserat på senaste passet — inte bara välja den muskelgrupp som vilat längst (som idag).

## Idag: AI eller inte?
**Inte AI.** `useSuggestedWorkout` är ren heuristik baserad på `useRecovery` (dagar sedan muskelgrupp tränades) + 4 hårdkodade templates (push/pull/legs/full_body). Den vet inte om PPL 6-dagars, Upper/Lower, Bro split etc.

## Rekommendation: regelbaserat med splits, inte AI
Splits är deterministiska rotationer — perfekt för regler. AI för detta vore overkill (kostar pengar, långsammare, kan hallucinera, kräver nätverk). Regelbaserat ger förutsägbart resultat och fungerar offline (kritiskt enligt projektets core-memory).

## Splits som täcks
Researchade vanliga splits — vi stödjer dessa rotationsmönster:

| Split | Dagar/v | Rotation |
|---|---|---|
| Full body | 1–3 | Helkropp → vila → Helkropp |
| Upper/Lower (2-dagars) | 2 | Upper → Lower |
| Upper/Lower (4-dagars) | 4 | Upper → Lower → Upper → Lower |
| Push/Pull (2-dagars) | 2 | Push → Pull |
| PPL (3-dagars) | 3 | Push → Pull → Legs |
| PPL (6-dagars) | 6 | Push → Pull → Legs → Push → Pull → Legs |
| Bro split (5-dagars) | 5 | Bröst → Rygg → Ben → Axlar → Armar |
| Arnold split (6-dagars) | 6 | Bröst+Rygg → Axlar+Armar → Ben (× 2) |
| 4-dagars klassisk | 4 | Bröst+Triceps → Rygg+Biceps → Ben → Axlar |
| Custom | – | Ingen rotation, faller tillbaka till nuvarande recovery-heuristik |

## Förändringar

### 1. Databas — split-val på profilen
- Lägg till `training_split` (text, nullable) på `pt_profiles` med enum-värden ovan (`full_body`, `upper_lower_2`, `upper_lower_4`, `push_pull_2`, `ppl_3`, `ppl_6`, `bro_5`, `arnold_6`, `classic_4`, `custom`).

### 2. Onboarding & profil-redigering
- I `PTOnboarding.tsx` / `PTProfileSettings.tsx`: lägg till ett steg/fält "Träningssplit" (visual_choice-style) där användaren väljer split. Defaultar till `custom` om man hoppar över.

### 3. Ny modul `src/lib/training-splits.ts`
- Definierar varje split som en ordnad lista av "pass-templates" (typ + label + muskelgrupper):
  ```ts
  SPLITS = {
    ppl_6: [
      { type: 'push', label: 'Push', groups: [...] },
      { type: 'pull', label: 'Pull', groups: [...] },
      { type: 'legs', label: 'Ben', groups: [...] },
      ...
    ],
    bro_5: [
      { type: 'custom', custom_name: 'Bröst', groups: ['chest', 'triceps'] },
      ...
    ],
    ...
  }
  ```
- Helper `getNextInSplit(split, lastWorkouts)`: tar de senaste N passen, matchar dem mot rotationen via `workout_type` + `custom_type_name`, och returnerar nästa steg.

### 4. Uppdaterad `useSuggestedWorkout`
- Hämta `ptProfile.training_split` + senaste 7 passens `workout_type` & `custom_type_name` (ny query mot `workout_sessions`).
- Om split är satt (≠ `custom`): kör `getNextInSplit` för att hitta nästa pass.
- Behåll vilodags-logiken (om `workoutsThisWeek >= weeklyTarget` → vilodag, om split tillåter det).
- Om split = `custom` eller historik saknas: använd nuvarande recovery-baserade heuristik som fallback.
- Reason-text uppdateras: "Du körde Push igår — dags för Pull enligt din PPL-split".

### 5. SuggestedWorkoutCard
- Visa split-namnet diskret ("PPL 6-dagars") under reason-texten.
- "Starta {nästa pass-label}" istället för bara typ.

## Tekniska detaljer
- För custom splits (bro, arnold, classic_4) startas passet som `workout_type='custom'` med ett deterministiskt `custom_type_name` (t.ex. "Bröst-dag", "Push A") som används både för att starta passet och för att matcha tillbaka i rotationen.
- Match-logik: jämför case-insensitive på `custom_type_name` när det finns, annars `workout_type`.
- Senaste pass hämtas via `workout_sessions` ordered by `started_at desc`, ignorera aktiva pass.

## Filer som ändras
- **Ny migration**: lägga till `training_split` på `pt_profiles`.
- **Ny**: `src/lib/training-splits.ts` (split-definitioner + helper).
- `src/hooks/useSuggestedWorkout.ts` — använd split-helper.
- `src/components/home/SuggestedWorkoutCard.tsx` — visa split-namn + bättre CTA.
- `src/components/pt/PTOnboarding.tsx` — steg för split-val.
- `src/components/profile/PTProfileSettings.tsx` — redigera split.
- `src/hooks/usePTProfile.ts` — typ + read/write för nytt fält.
