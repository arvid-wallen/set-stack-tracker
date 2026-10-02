# Genomgång och förbättring av appens UI/UX (mobil)

## Vad genomgången visar
- Laddning ser olika ut överallt: vissa sidor visar snurrande ikon, andra grå block, vissa ingenting. Det ger ett ryckigt intryck.
- Sidbyten saknar övergång – innehållet "hoppar" in.
- Animationer finns men är spridda och olika i tempo.
- Inga rörliga eller "levande" element som ger appen en egen premiumkänsla.
- Varningsfärger i statistik är hårdkodade (rött/grönt) och följer inte Haus-paletten.
- Kvarlämnad mallstil (gammal centrering och padding) som kan störa layout.
- Tomma lägen (inga pass, ingen statistik) är platta och säger inte vad man ska göra.

## Förbättringar

### 1. Enhetlig rörelse
- En gemensam rörelseprofil: snabb (150 ms), normal (250 ms), mjuk fjädring för knapptryck.
- Mjuk övergång vid sidbyte (tona + liten glidning) och kort i listor som glider in i tur och ordning.
- Bottenmenyn: den gröna markeringen glider mellan ikonerna i stället för att hoppa.
- Siffror (volym, set, streak) räknar upp när de visas.
- Allt respekterar inställningen "minska rörelse".

### 2. Laddning och skeletons
- Skeletons med mjuk skimmer som matchar varje sidas riktiga form: Hem, Kalender, Statistik, Bibliotek, Profil, Planering, övningsstatistik.
- En egen Haus-laddare (pulserande logga/ring) vid appstart och inloggning i stället för vit skärm.
- Knappar som sparar visar laddning i knappen själv, inte en snurra bredvid.
- AI-förslag och PT-chatten får en "tänker"-animation.

### 3. 3D och levande element (sparsamt)
- Hem: en mjukt roterande 3D-form (t.ex. glasig kettlebell/abstrakt blob i Haus-grönt) bakom hälsningen som rör sig lätt när man lutar telefonen.
- Veckomålsringen fylls med animation och "lyser" när målet nås.
- Avsluta pass: sammanfattningskort som vänds fram i 3D tillsammans med konfettin.
- Personbästa: liten medaljanimation när ett nytt rekord loggas.
- Tung 3D laddas först när den behövs så appen inte blir långsammare.

### 4. Användarvänlighet
- Större tryckytor (minst 44 px) och viktiga knappar nära tummen.
- Lätt vibration på telefoner som stödjer det vid sparat set, klar övning och avslutat pass.
- Bekräfta-ångra: radera set/övning visar "Ångra" i stället för dialog.
- Dra nedåt för att stänga alla bottenpaneler; dra för att uppdatera på Hem och Kalender.
- Tydliga tomlägen med illustration och en knapp till nästa steg.
- Konsekventa sidhuvuden (samma titelstorlek, bakåtknapp, luft) på alla sidor.
- Klistrig rubrik som krymper när man scrollar.

### 5. Visuell polish
- Statistikens trendfärger använder appens egna färger.
- Kort får enhetliga hörn, skuggor och en diskret glaskänsla.
- Rensa bort gamla mallstilar som påverkar layouten.
- Kontroll av mörkt och ljust läge på alla sidor.

## Ordning
1. Rörelseprofil, sidövergångar, bottenmeny, städning av stilar.
2. Skeletons och laddare på alla sidor.
3. Användarvänlighet (vibration, ångra, dra-för-att-stänga, tomlägen, sidhuvuden).
4. 3D-form på Hem, målring, avsluta-pass-kort, PR-medalj.
5. Genomgång i mobilvy med skärmdumpar av varje sida.

## Tekniska detaljer
- Lägg till `framer-motion` (AnimatePresence för routes, layoutId för nav-indikator, stagger-listor, useSpring för count-up).
- 3D: `three` + `@react-three/fiber@^8` + `@react-three/drei@^9` (React 18-kompatibla), lazy-loadad via `React.lazy`, pausas när fliken är dold, statisk fallback vid reduced motion / svag enhet.
- Ny `src/components/ui/page-skeletons.tsx` med per-sida skeletons + shimmer-keyframe i tailwind.
- `src/lib/haptics.ts` (navigator.vibrate med feature-check).
- Ångra via sonner-toast med action; vaul-drawer för swipe-to-close.
- Ersätt `text-green-600/red-600` i StatCard m.fl. med semantiska tokens (`success`/`destructive`).
- Töm `src/App.css` (oanvänd mallstil med `#root` padding).
- Ingen ändring av data eller backend.
