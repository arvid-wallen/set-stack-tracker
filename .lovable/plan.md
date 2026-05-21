## Mål: Förbättra Veckomål-kortet på startsidan

Idag visar kortet bara veckomålet (3 pass/vecka). Vi gör det mer flexibelt:

1. **Klick på kortet → roterar mellan Vecka- och Månadsvy**
2. **"⋯"-meny för snabbredigering** av mål + sammansättning (t.ex. 6 pass/vecka = 4 styrka + 2 kondition)
3. **Visar progress per typ** (t.ex. "Styrka 2/4 · Kondition 1/2")

---

### 1. Datamodell (migration)

Lägg till två fält på `profiles`:
- `monthly_goal` (int, default 12) — totalt antal pass per månad
- `goal_composition` (jsonb, default `{}`) — fördelning per workout-typ, t.ex. `{"strength": 4, "cardio": 2}`

"Strength" är ett samlat alias som matchar alla `workout_type` förutom `cardio` (push/pull/legs/full_body/upper/lower/custom). Det håller UI:t enkelt — användaren behöver bara välja Styrka vs Kondition.

### 2. `useTrainingMetrics` utökas

Returnerar även:
- `workoutsThisMonth`, `monthlyGoal`, `monthlyProgress`
- `breakdownThisWeek` / `breakdownThisMonth`: `{ strength: number, cardio: number }`
- `goalComposition`: `{ strength: number, cardio: number }` (default härleds från totalmål)

### 3. UI-ändringar i `src/pages/Index.tsx`

North Star-kortet ("Veckomål"):
- Görs till en `button` som togglar lokal state `view: 'week' | 'month'`
- Etiketten byter mellan **VECKOMÅL** och **MÅNADSMÅL**
- Progress-ring + räknare visar aktuell vy
- Under huvudraden visas en liten kompositions-progress: `Styrka 2/4 · Kondition 1/2` (om composition finns)
- I övre högra hörnet: `DropdownMenu` med `MoreHorizontal`-ikon (⋯) — `stopPropagation` så toggle inte triggas
  - Meny-items: *Redigera vecko­mål*, *Redigera månads­mål*, *Sätt sammansättning*
  - Alla öppnar en `Sheet` (`GoalEditorSheet`) förvald på rätt flik

### 4. Ny komponent: `src/components/home/GoalEditorSheet.tsx`

Bottom-sheet med två flikar (Tabs): **Vecka** / **Månad**
- Stepper (−/+) för totalt antal pass (1–14 vecka, 1–60 månad)
- Två rader för sammansättning: **Styrka** och **Kondition**, var och en med stepper
- Validering: summan av styrka+kondition får inte överstiga totalen; om < total visas "X pass valfri typ"
- "Spara"-knapp anropar `updateProfile({ weekly_goal, monthly_goal, goal_composition })`

### 5. Profil-edit (`PersonalInfoSection`)

`updateProfile`-typen utökas med `monthly_goal` och `goal_composition`. Befintliga profil­fält påverkas inte visuellt — endast typen.

---

### Tekniska detaljer

- Persistens av valt vy-läge: `localStorage` (`goal-card-view`) så det överlever omladdning
- Strength-klassificering i metrics:
  ```ts
  const isStrength = s.workout_type !== 'cardio'
  ```
- Månads­fönster: `startOfMonth(now)` → `endOfMonth(now)` via `date-fns`
- Tillgänglighet: knappen får `aria-label="Byt mellan vecko- och månads­mål"`; ⋯-knappen `aria-label="Redigera mål"`
- Inga ändringar i `SuggestedWorkoutCard` eller `pt_profiles` denna sprint

### Filer som ändras

- `supabase/migrations/...` (ny) — lägger till `monthly_goal`, `goal_composition` på `profiles`
- `src/hooks/useProfile.ts` — uppdatera typ + tillåtna update-fält
- `src/hooks/useAuth.ts` — profile-typ får nya fält
- `src/hooks/useTrainingMetrics.ts` — månadsmetrics + breakdown
- `src/pages/Index.tsx` — gör kortet klickbart, lägg till ⋯-meny + composition-rad
- `src/components/home/GoalEditorSheet.tsx` (ny)
