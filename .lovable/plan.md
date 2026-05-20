# Buggrapport och planerade fixar

Efter genomgång av koden hittade jag 7 konkreta buggar. De är sorterade efter allvarlighetsgrad.

---

## 1. 🔴 Sparade set kan inte redigeras (databugg)

**Plats:** `src/components/workout/ExerciseCard.tsx`

I `SetRow` finns logik för att klicka på ett sparat set → går in i redigerings­läge → spara ändringen. Men i `ExerciseCard` skickas `onSave={() => {}}` (tom funktion) för alla existerande set. Det betyder att om du ändrar vikt/reps på ett redan sparat set så händer **ingenting** — ändringen försvinner.

**Fix:** Wire upp `updateSet` från `useWorkout`-hooken hela vägen ner till `SetRow`. Lägg `onUpdateSet` som prop på `ExerciseCard` och anropa den i SetRows `onSave` för existerande set.

---

## 2. 🔴 Kasserade/borttagna pass lämnar skräp i databasen

**Plats:** `discardWorkout` och `removeExercise` i `src/hooks/useWorkout.tsx`

DB:n har **inga foreign keys alls** mellan `workout_sessions` → `workout_exercises` → `exercise_sets` / `cardio_logs`. När du kasserar ett pass tas bara `workout_sessions`-raden bort. Alla tillhörande set, övningar och cardio-loggar blir kvar som föräldralösa rader för alltid. Samma sak när man tar bort en övning mitt i passet.

**Fix:** Migration som lägger till `ON DELETE CASCADE` på FK-relationerna:
- `workout_exercises.workout_session_id` → `workout_sessions.id`
- `exercise_sets.workout_exercise_id` → `workout_exercises.id`
- `cardio_logs.workout_exercise_id` → `workout_exercises.id`

Plus en engångs-rensning av befintliga orphan-rader.

---

## 3. 🟠 Offline-redigeringar av set försvinner vid synk

**Plats:** `syncPendingActions` i `src/hooks/useWorkout.tsx`

`PendingAction.type` har `'updateSet'` definierat men synk-loopen hanterar bara `addSet` och `deleteSet`. `updateSet` köar inte heller offline-ändringar — den försöker bara köra direkt mot Supabase och misslyckas tyst om man är offline.

**Fix:** Lägg till offline-köning i `updateSet` (samma mönster som `addSet`/`deleteSet`) och hantera `updateSet`-fallet i `syncPendingActions`.

---

## 4. 🟠 Service workern bråkar med Lovable-previewen och cachar för aggressivt

**Plats:** `src/main.tsx` + `public/sw.js`

Två problem:
- SW:n registreras alltid, även när appen kör i Lovables preview-iframe. Det orsakar att kodändringar inte syns i previewen eftersom gammal HTML/JS serveras från cache.
- `fetch`-handlern cachar **alla** GET-requests (även hashade JS-chunks). Vid nya deploys kan installerade enheter köra fast på gammal kod tills cachen rensas.

**Fix:**
- Skydda registreringen så SW:n inte registreras i iframe eller på `id-preview--*.lovable.app` / `*.lovableproject.com`-hostar (avregistrera om den redan finns där).
- Begränsa caching: använd `NetworkFirst` enbart för navigationer (HTML) och hoppa över allt annat så browsern hanterar JS/CSS normalt.

---

## 5. 🟠 Fonter inkonsekventa efter Apercu-bytet

**Plats:** `tailwind.config.ts` + `src/pages/Index.tsx`

Tidigare bytte vi `--font-heading` / `--font-display` till Apercu i CSS, men `tailwind.config.ts` mappar fortfarande `font-display` och `font-heading` till `'Seriguela Display'` / `'Seriguela'`. Hero-rubriken på startsidan använder `font-display font-black` — `font-black` (vikt 900) finns inte i Apercu (bara 400/500/700) så browsern syntetiserar tjock text som ser konstig ut.

**Fix:**
- Peka `font-display`, `font-heading` och `font-body` på `Apercu` i tailwind-configen.
- Ändra hero-rubriken från `font-black` till `font-bold` (700) som faktiskt finns i Apercu.

---

## 6. 🟡 Offline-set får temporära ID:n som aldrig stäms av

**Plats:** `addSet` i `src/hooks/useWorkout.tsx`

När du loggar set offline får de `id: temp-<timestamp>`. När du sedan kommer online körs `syncPendingActions` och sen `checkActiveWorkout` som refetchar från servern — men under tiden där emellan kan användaren hinna trycka radera/redigera på ett temp-set, vilket gör en server-anrop mot ett ID som inte finns. Operationen "lyckas" tyst utan att göra något.

**Fix:** Blockera redigera/radera-knapparna för set vars id börjar med `temp-` (visa "synkar..." istället), och se till att lokal state alltid ersätts med serverdata efter `syncPendingActions`.

---

## 7. 🟡 Auth-event kan tappas vid start

**Plats:** `src/hooks/useAuth.ts`

`getSession()` körs **före** `onAuthStateChange`-prenumerationen sätts upp. Supabase-rekommendationen är motsatt ordning — annars kan auth-events mellan de två anropen tappas (t.ex. om token refresh sker precis vid mount).

**Fix:** Flytta `onAuthStateChange`-prenumerationen ovanför `getSession()`-anropet.

---

## Teknisk sammanfattning

| # | Typ | Filer |
|---|---|---|
| 1 | Frontend wiring | `ExerciseCard.tsx`, `SetRow.tsx`, `ActiveWorkout.tsx` |
| 2 | DB-migration | Nya FK:er med `ON DELETE CASCADE` + cleanup-query |
| 3 | Hook-logik | `useWorkout.tsx`, `offline-storage.ts` |
| 4 | PWA | `main.tsx`, `public/sw.js` |
| 5 | Designtokens | `tailwind.config.ts`, `pages/Index.tsx` |
| 6 | State | `useWorkout.tsx`, `SetRow.tsx` |
| 7 | Auth | `useAuth.ts` |

Jag implementerar alla 7 om du godkänner planen. Vill du att jag hoppar över någon (t.ex. om du vill behålla service workern som den är) — säg till så plockar jag bort den punkten.