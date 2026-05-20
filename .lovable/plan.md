
# Plan: Gör appen bättre baserat på rapporten

Rapporten är skriven för en kommersiell flerproduktsmarknad. Eftersom vår app är en **personlig single-user PWA** filtrerar jag bort allt som inte är relevant (social, gruppträning, paywall, AR/VR, freemium, marknadsföring). Kvar blir det som faktiskt höjer **kärnloopen**: logga → se framsteg → komma tillbaka.

## Vad vi redan har ✅

- Passloggning med set/reps/vikt (kg), supersets, warmup, cardio
- Routines/mallar + eget övningsbibliotek
- Progressive overload-förslag (AI)
- 1RM, per-övningsmål, PRs, volym/muskelgrupp-grafer
- Kalender/historik, CSV-export
- PT-chat (AI-coach)
- Progress photos
- PWA + offline + auto-pause + konfetti

## Vad rapporten pekar på att vi saknar — sorterat efter effekt/insats

### 🟢 Snabba vinster (låg insats, hög effekt)

**1. Streaks och milestones (gamification light)**
Rapporten: streaks/badges driver vanebildning utan att överlasta. Vi har konfetti men inget som binder veckor ihop.
- Veckostreak (X veckor i rad med ≥ målantal pass)
- "Träningsdagar senaste 28 dagarna" som central siffra på Home (matchar rapportens föreslagna **North Star: completed workouts per 28 days**)
- Badges vid milstolpar: 10/50/100 pass, första PR på övning, första 4-veckors-streak

**2. Veckomål + progress-ring på Home**
Idag finns greeting men ingen "var står jag denna vecka". Lägg till mål "X pass/vecka" i profilen och en ring/bar på Home som fylls.

**3. RPE/RIR i UI**
Fältet finns i schemat men exponeras inte tydligt i SetRow. Snabbval (1–5) gör data rikare för framtida adaptiv logik.

**4. Tillgänglighet-svep**
Audit av kontrast (kolla `#aafcae` på `#f2f0eb`), `aria-label` på ikonknappar, fokus-ringar, touch-targets ≥ 44px, screen reader-test av SetRow.

**5. Data-portabilitet utökad**
CSV finns. Lägg till **JSON-export av allt** (övningar, mallar, pass, foton-metadata) + **"radera alla mina data"**-knapp i Profile → uppfyller dataminimering/portabilitet i rapporten.

### 🟡 Strategiska satsningar (medel insats, hög effekt)

**6. Riktig profilbaserad onboarding**
Idag dyker man rakt in i appen. Förstagångsflöde:
- Mål (styrka / kondition / hälsa / återkomst efter uppehåll)
- Erfarenhetsnivå
- Tillgänglig utrustning (filtrerar övningsbibliotek)
- Tid per pass + pass/vecka
- Skador/begränsningar (frikodtext + förvalda muskelgrupper att undvika)
Sparar i `profiles`-tabellen och styr förslag, mallar och PT-chat-kontext.

**7. Träningsbelastning + återhämtning per muskelgrupp**
Rapportens "adaptiva program" i light-version: visa per muskelgrupp **dagar sedan senaste set** och **veckovolym vs föregående**. Hjälper användaren själv att fatta beslut utan komplicerad AI.
- Liten heatmap-vy på Stats: "Bröst tränades senast för 5 dagar sedan, 12 set"
- Varning på Home om någon grupp inte tränats på >10 dagar (om relevant för målet)

**8. Adaptivt veckoprogram (light)**
Vi har routines men inget förslag "vad ska jag göra idag?". Bygg en `suggestNextWorkout()`-hook som baseras på:
- Användarens målfrekvens
- Vad som tränats senaste 7 dagarna
- Vilka muskelgrupper som är "skyldiga"
Visas som ett kort på Home: "Föreslaget pass idag: Pull (3 dagar sedan)".

**9. PWA-push-notiser för påminnelser**
Rapporten: notisrespons är ett KPI för engagemang. Aktivera Web Push:
- Daglig påminnelse om dagar man brukar träna
- "Du har inte tränat på X dagar"
- Streak-skydd: "Du behöver träna idag för att behålla din streak"
Kräver service worker (har vi) + VAPID-keys + opt-in i Profile.

**10. Pass-sammanfattning vid avslut**
EndWorkoutSheet finns men kunde visa mer värde: nya PRs som slogs i passet, total volym vs förra gången samma övning, badges som låstes upp. Pumpar upp dopaminet på rätt sätt.

### 🟠 Större men värdefulla (medel-hög insats)

**11. Apple Health-sync (skriv)**
Beslutet i tidigare meddelanden: fortsätt som PWA, men sync. Eftersom vi är PWA kan vi inte använda HealthKit direkt. Två vägar:
- **a)** Kalorier/duration som CSV-export till Apple Health via "Health Auto Export"-appen (dokumentera bara, ingen kod)
- **b)** En liten companion Shortcuts-receptberedning som POSTar till en edge function. Mer jobb.
Rekommenderar (a) som dokumentation-only nu.

**12. Readiness/daily check-in (lätt)**
Innan pass: 3 frågor (sömn 1–5, energi 1–5, ömhet 1–5). Sparas och visas i grafer. Kostar lite kod men ger fin långsiktig data.

**13. Smärt-/skadetracker för rehab-läge**
Om "skador" sätts i onboarding: visa varning på övningar som triggar berörda muskelgrupper + smärtskattning per pass. Light-version av rapportens "rehab-läge".

## Vad jag medvetet hoppar över (passar inte vår app)

- Social/grupp/följ-vänner — single-user
- Paywall/freemium/Stripe — personlig app
- Klassbokning, drop-in — personlig app
- AR/VR och kameraform-korrigering — för dyrt/bräckligt och du tränar på gym, inte hemma framför kamera
- Computer vision — samma
- Klinisk QA av rehab-innehåll — vi gör light-version, inte medicinsk produkt

## Föreslagen ordning att bygga (i sprintar)

**Sprint 1 — Quick wins (1 omgång)**
Punkt 1 (streaks + badges + 28-dagars North Star på Home), 2 (veckomål + ring), 3 (RPE/RIR i UI), 10 (pass-summary med PRs)

**Sprint 2 — Hygien & data (1 omgång)**
Punkt 4 (a11y-audit), 5 (JSON-export + radera-allt)

**Sprint 3 — Profil & adaptivt (2 omgångar)**
Punkt 6 (onboarding), 7 (recovery-heatmap), 8 (suggestNextWorkout)

**Sprint 4 — Engagement loop (1 omgång)**
Punkt 9 (push), 12 (readiness check-in)

**Sprint 5 — Specialiserat (om/när relevant)**
Punkt 11 (Health-sync dokumentation), 13 (skadetracker)

## Teknisk sammanfattning

| Område | Filer som påverkas |
|---|---|
| Streaks/badges/28d | Ny `useStreaks.ts`, `Home/Index.tsx`, ny `badges`-tabell |
| Veckomål | `profiles`-tabell (kolumn `weekly_goal`), `Index.tsx` |
| RPE/RIR UI | `SetRow.tsx` |
| A11y | hela `src/components` (audit) |
| JSON-export + radera | `lib/export-utils.ts`, `Profile.tsx`, ny edge function för cascade-delete |
| Onboarding | `profiles`-tabell (flera kolumner), ny `OnboardingFlow.tsx` |
| Recovery-heatmap | Ny `useRecovery.ts`, `Stats.tsx` |
| Adaptivt förslag | Ny `useSuggestedWorkout.ts`, `Index.tsx` |
| Push | `sw.js`, ny edge function `send-push`, `subscriptions`-tabell, VAPID secrets |
| Pass-summary | `EndWorkoutSheet.tsx`, `useWorkout.tsx` |
| Readiness | Ny `readiness_logs`-tabell, ny `ReadinessCheck.tsx`, `ActiveWorkout.tsx` |

Säg till om du vill att jag kör Sprint 1 direkt, eller om du vill ändra ordningen/skippa något.
