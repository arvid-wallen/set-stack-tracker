## Diagnos

Profil-sidan är seg för att den triggar 8+ tunga Supabase-anrop parallellt vid mount, varav flera laddar HELA träningshistoriken — bara för att kunna visa ett par siffror och aktivera en exportknapp.

### Vad som händer när `/profile` öppnas

1. **`useWorkoutHistory()`** (kallas bara för exportknappen) gör 4 sekventiella queries: alla `workout_sessions` → alla `workout_exercises` med joins → alla `exercise_sets` → alla `cardio_logs`. Resultatet visas inte ens på sidan.
2. **`useStats()`** (i `StatsOverview`) gör 3 parallella queries: alla sessions, alla `exercise_sets` med deep joins, och alla session-datum *igen*.
3. **`useProgressPhotos()`** hämtar alla foton och anropar sen `createSignedUrl` en gång per foto (N round-trips).
4. **`useProfile()`** och `useProgressPhotos()` använder `useState/useEffect` istället för react-query → refetchar varje gång man navigerar tillbaka, ingen cache.

Totalt: hela tabellen `exercise_sets` hämtas två gånger, `workout_sessions` 3 gånger, plus N storage-anrop. Allt detta bara för att visa avatar, namn och 6 statistikrutor.

### Bugar som hittats samtidigt

- **1000-radersbegränsning**: `useStats` och `useWorkoutHistory` hämtar `exercise_sets`/`workout_exercises` utan paginering. Supabase returnerar max 1000 rader → totalvolym/sets blir tyst fel när historiken växer.
- **Cache-bugg i `useStats`**: `queryKey: ['stats-workouts', period]` men `period` används aldrig i query — så cachen invalideras i onödan vid bytt period.
- **Saknad user-isolering i query-key**: `'stats-session-dates'` har inget `user_id` → kan returnera fel cache mellan användare.
- **`useStats` dubbelhämtar `workout_sessions`**: en gång för stats, en gång för "sessionDates" — kan slås ihop.
- **`useWorkoutHistory` på Profil**: kallas trots att inget från den visas. Bara `workouts.length` används för att gråa exportknapp.
- **`useProgressPhotos` saknar cache**: ingen react-query → refetchar och signerar om URL:er varje besök, även om inget ändrats.

## Åtgärder

### 1. Profil-sidan: ladda bara det som visas
- Ta bort `useWorkoutHistory()` från `Profile.tsx`. Använd istället ett lätt count-query (eller bara låt exportknappen alltid vara aktiv och visa "inget att exportera"-toast om tomt) — eller lazy-loada export först när användaren klickar.
- Resultat: 4 tunga queries försvinner från sidladdningen.

### 2. Slå ihop `useStats`-queries och paginera bort 1000-radersgränsen
- Ta bort den separata `stats-session-dates`-queryn — sessions-queryn redan har `id` + `started_at`, bygg `Map` av det.
- Lägg `user_id` i alla query keys (`['stats-workouts', userId]`, `['stats-sets', userId]`).
- Ta bort oanvänd `period` ur query key.
- Hämta `exercise_sets` paginerat (loopa med `.range(from, to)` tills färre än sidans storlek returneras) — eller switcha till ett aggregerat snapshot via en RPC. Steg 1: paginerad client-loop räcker, snabbt fix.
- Samma paginerings-fix på `workout_exercises` och `exercise_sets` i `useWorkoutHistory`.

### 3. Konvertera `useProfile` och `useProgressPhotos` till react-query
- Cache + automatisk dedup mellan navigeringar (`staleTime: 5 min`).
- För progressfoton: behåll signerings-loop men cache:a hela listan så den inte körs om vid varje navigering.

### 4. Lazy-load tunga sektioner på Profil
- Wrappa `StatsOverview`, `ProgressPhotos` och `PTProfileSettings` i `React.lazy` + `Suspense` med en liten skeleton, så top-of-page (header + namn + epost) målas direkt och resten strömmar in.
- Alternativ: behåll synkron import men låt sektionerna ha egna `isLoading`-skeletons (de har redan det) — sidan kommer då rendera direkt utan att vänta på att alla queries löst.

### 5. Snabbvinst: ta bort vänteblockaden i Profile.tsx
- Idag: `if (authLoading || profileLoading) return <SkeletonScreen/>` — hela sidan är blank tills profil-queryn klar.
- Fix: returnera layouten direkt, låt varje sektion visa egen skeleton tills dess data finns. Användaren ser strukturen omedelbart.

## Övriga sidor (snabbsweep)

Samma underliggande hookar driver också Hem och Stats:

- `Index.tsx` använder `useWorkoutHistory()` för att kunna öppna detaljvyn på ett historiskt pass. Det blockar inte first paint, men ladar fortfarande hela historiken. Vi kan ändra så att detaljvyn fetchar ett enskilt pass on-demand när användaren klickar.
- `Stats.tsx` använder samma `useStats` — vinner samma snabbhetsförbättringar gratis när vi fixar (2).
- `useProgressPhotos.uploadPhoto`/`deletePhoto`: ingen bugg, men signed URLs cachas inte mellan sessioner — låg prio.

## Filer som ändras

- `src/pages/Profile.tsx` — ta bort `useWorkoutHistory`, ta bort full-screen skeleton, lazy-loada tunga sektioner.
- `src/hooks/useStats.ts` — slå ihop sessions/sessionDates, lägg user_id i keys, ta bort period från keys, paginera sets.
- `src/hooks/useWorkoutHistory.ts` — paginera workout_exercises och sets, lägg user_id i query key.
- `src/hooks/useProfile.ts` — flytta till react-query.
- `src/hooks/useProgressPhotos.ts` — flytta till react-query (cache + dedup).
- `src/pages/Index.tsx` — (mindre) hämta enskilt pass on-demand istället för hela historiken för detaljvyn.

## Förväntat resultat

- Profil målas på <300 ms istället för 2–5 s.
- Bakgrundsstatistik dyker upp progressivt utan att blockera headern.
- Totalvolym/sets blir korrekta även när historiken passerar 1000 sets.
- Mindre Supabase-trafik på samtliga sidor.
