## Mål

Bygg om hela onboarding-flödet så att en användare som precis skapat konto:

1. Inte trillar tillbaka till inloggningssidan efter PT-onboardingen
2. Möts av ett trevligt, animerat onboarding-flöde med alla viktiga frågor
3. Landar direkt i appen (inloggat läge) och får en guidad, animerad rundtur över vyerna
4. Avslutar med en pepp-animation och ett "Nu kör vi!"

---

## Buggen vi fixar först

Idag renderas `OnboardingGate` globalt i `App.tsx`. När en användare skapar konto via `/auth` och får en session, öppnas `PTOnboarding` ovanpå auth-sidan. När onboardingen sparas stängs bara dialogen — användaren står kvar på `/auth` och ser inloggningsformuläret igen, fast hen är inloggad.

**Fix:** När onboardingen är klar navigerar vi till `/` (Index) så användaren möts av appen i inloggat läge. Vi ser också till att `Index` inte visar `AuthForm` när det finns en aktiv session.

---

## Steg 1 — Utökad första-onboarding (PT + profil)

Slå ihop dagens 6-stegs PT-onboarding med profilfält så vi får ALLT på en gång. Nytt flöde, 7 korta steg, en fråga per skärm med animerade övergångar (fade + slide via Tailwind `animate-fade-in`/`animate-scale-in`):

1. **Välkomst** — animerad logga, "Hej {förnamn}! Vi sätter upp din profil på en minut."
2. **Om dig** — kön (chips), ålder (slider), längd (cm), vikt (kg)
3. **Mål** — flerval med emojis (befintlig logik)
4. **Erfarenhet** — nybörjare/medel/avancerad
5. **Utrustning + tid** — utrustning (flerval), minuter per pass, dagar per vecka
6. **Split** — välj training split (befintliga `TRAINING_SPLIT_OPTIONS`)
7. **Begränsningar (valfritt)** — skador/hälsa fritext
8. **Klar!** — celebration-skärm med konfetti (`celebrate()` från `src/lib/celebrate.ts`) + knapp "Visa mig runt"

Tekniskt:
- Bygg om `src/components/pt/PTOnboarding.tsx` (eller skapa `src/components/onboarding/FirstRunOnboarding.tsx`) som driver alla 8 steg och returnerar både PT-profil-data och ev. profil-uppdateringar (kön/ålder/längd/vikt finns redan på `pt_profiles`, namn finns redan på `profiles` via signup).
- Progressindikator-baren i toppen behålls, animeras smidigt.
- Stegövergångar: wrappa varje steg i en `key`-baserad div med `animate-fade-in` så den re-mountas och animerar in.
- Knappar har `press-feedback` + scale-on-tap för känsla.

---

## Steg 2 — Guidad rundtur i appen (in-app coachmarks)

När användaren trycker "Visa mig runt" stängs onboarding-dialogen, vi navigerar till `/` och en ny komponent `<AppTour />` tar över ovanpå Index-sidan.

`AppTour` är ett fullskärmsoverlay med:

- Mörk backdrop med blur
- Ett centrerat kort som animerar in (`animate-scale-in`)
- Stora ikoner (Lucide) som motsvarar varje vy + kort beskrivning
- Animerad pekare/markering som "hoppar" till motsvarande knapp i `BottomNav` (vi använder absolut positionering relativt nav-baren, eller bara highlightar nav-iconen via en pulsande ring som styrs från Tour-state)
- Pillerknappar "Hoppa över" och "Nästa"

Steg i rundturen (5 korta + 1 outro):

1. **Hem** — "Starta pass och se dina mål"
2. **Kalender** — "All historik på ett ställe"
3. **Statistik** — "Följ din utveckling och PRs"
4. **Bibliotek** — "Övningar och färdiga rutiner"
5. **Profil** — "Mål, foton och inställningar"
6. **Nu kör vi!** — stor rubrik, konfetti-burst, knapp "Sätt igång" som stänger touren

Tekniskt:
- Ny fil: `src/components/onboarding/AppTour.tsx`
- Persistens: när touren är klar/skippas, sätt `localStorage.setItem('app-tour-completed', '1')` så den aldrig visas igen.
- Triggning: efter `savePTProfile()` lyckas, sätt ett state `showTour=true` i `OnboardingGate` (eller flytta logiken till en ny `OnboardingFlow`-komponent som äger både stegen och touren).
- Animationer: ren Tailwind/CSS — fade, scale, pulse på nav-target, samt `celebrate()` på sista steget.

---

## Steg 3 — Rensa upp routing-buggen

I `OnboardingGate.tsx`:
- Använd `useNavigate()` från react-router.
- När `savePTProfile` returnerar OK: `navigate('/', { replace: true })` innan dialogen stängs.

I `src/pages/Index.tsx`:
- Behåll `if (!user) return <AuthForm/>` men säkerställ att den inte triggas under en kort race när session redan finns (auth-loading hanteras redan).

I `src/components/auth/AuthForm.tsx`:
- När signup lyckas och det redan finns en session (auto-confirm är på) — navigera direkt till `/`. Om e-postverifiering krävs, visa befintlig toast.

---

## Filer som ändras / skapas

**Skapas**
- `src/components/onboarding/AppTour.tsx` — den guidade rundturen
- `src/components/onboarding/OnboardingFlow.tsx` (valfritt) — wrapper som äger steg + tour
- ev. `src/components/onboarding/WelcomeStep.tsx`, `AboutYouStep.tsx` etc. om vi splittar

**Ändras**
- `src/components/pt/PTOnboarding.tsx` — utökat flöde, snyggare animationer, celebration-skärm
- `src/components/onboarding/OnboardingGate.tsx` — navigera efter klar, trigga AppTour
- `src/hooks/usePTProfile.ts` — `PTProfileInput` täcker redan kön/ålder/längd/vikt, ingen DB-migration behövs
- `src/components/auth/AuthForm.tsx` — navigera till `/` när session finns efter signup
- ev. `src/pages/Index.tsx` — säkerställ tour-mount

---

## Vad som INTE ingår

- Ingen DB-migration (alla fält finns redan på `pt_profiles`/`profiles`)
- Ingen ny dependency (`canvas-confetti` finns redan, allt animeras med Tailwind/CSS)
- Inga ändringar i resten av appen (workouts, stats etc.)

Säg till om du vill ändra/lägga till något i flödet innan jag bygger.