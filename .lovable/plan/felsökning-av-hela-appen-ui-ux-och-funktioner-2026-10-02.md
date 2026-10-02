# Felsökning av hela appen – UI/UX och funktioner

## Mål
Hitta och rätta buggar i hela appen: element som krockar, ligger för tätt eller hamnar utanför skärmen, samt fel i funktioner (pass, sparande, offline, mål, statistik, PT-chatt).

## Steg 1 – Automatisk genomsökning (inloggad, telefonstorlek)
- Logga in i förhandsvisningen och gå igenom alla sidor: Hem, Bibliotek, Kalender, Planering, Statistik, Övningsstatistik, Profil, samt passvyn (starta pass, lägg till övning, superset, vilotimer, minimerat läge, avsluta-kort) och bottenpaneler.
- Testa på tre bredder: 360, 390 och 430 px, ljust och mörkt läge.
- Ett skript mäter automatiskt på varje vy:
  - knappar/element som överlappar varandra
  - tryckytor mindre än 44 px eller närmare än 8 px
  - innehåll som går utanför skärmens högerkant (sidledsscroll)
  - text som klipps eller trunkeras olämpligt
  - flytande element som krockar: bottenmenyn, minimerad passrad, vilotimer, PT-fliken, toast-meddelanden
- Samla konsolfel och misslyckade nätverksanrop per vy.
- Skärmdumpar granskas manuellt för det som mätningen inte fångar.

## Steg 2 – Kodgranskning av funktioner
- Passflödet: lägga till/radera set (med ångra), superset, autopaus, återuppta, avsluta, kasta pass, planerade pass.
- Offline-kö och synk: dubbletter, ordning, att ångrade raderingar inte skickas.
- Mål, streak, trender och statistikberäkningar.
- PT-chatt-fliken: redan känt fel – vid tryck på telefon öppnas chatten två gånger (både tryck- och klickhändelse); fliken kan även hamna ovanpå passvyns knappar beroende på sparad position.
- Inloggning/omdirigering, onboarding och guidad tur.

## Steg 3 – Åtgärder
- Rätta alla hittade fel i samma omgång, prioriterat: krascher/dataförlust → funktionsfel → krockar/överlapp → finputs.
- Gemensamt avstånd för flytande element så att de aldrig ligger på varandra (t.ex. vilotimer, minibar, toast och PT-flik får fasta lägen relativt bottenmenyn/knappraden).

## Steg 4 – Verifiering
- Kör samma genomsökning igen och bekräfta noll överlapp, ingen sidledsscroll och inga nya konsolfel.
- Kort rapport till dig: vad som hittades och vad som rättades, samt det som eventuellt kräver ditt beslut.

## Tekniskt
- Playwright (Python) med inloggad session, viewport per bredd, `getBoundingClientRect` på alla interaktiva element för överlapp/avstånd, `scrollWidth > clientWidth` för sidledsöverflöde.
- Ingen databasändring planeras om inte en funktionsbugg kräver det.
