# MCP-server för gymappen

Bygger en remote MCP-server (streamable HTTP) så en AI-coach kan läsa färsk träningsdata och skriva in planerade pass direkt i appen. Plus det app-UI som krävs för att planerade pass, kroppsvikt och övningsalias ska funka på riktigt.

## 1. Databasändringar

**Planerade pass** — `workout_sessions` får:
- `status` (`planned` / `active` / `completed`) härlett från nuvarande `is_active`/`ended_at`
- `planned_date` (datum utan tid, för pass som ännu inte körts)
- `title` (fritext, t.ex. "Ben med Tina")
- `source` (`app` / `mcp`)

**Målvärden per övning** — `workout_exercises` får:
- `target_sets` (heltal)
- `target_reps` (text, tillåter intervall "5-6", "12-15")
- `target_weight_kg` (decimal)

Sets ärver mål från sin övning, så `get_workout` kan visa mål vs utfall på samma set.

**Kroppsvikt** — ny tabell `body_weight_logs`: vikt i kg (decimal), datum, valfri anteckning. Bara du ser dina egna rader.

**Övningsalias** — ny tabell `exercise_aliases`: alias-text → övning. Gör att "Db curl", "Decline DB curl" och "Cable curl" kan mappas mot rätt kanonisk övning så historiken inte splittras. Seedas med normaliserade varianter av befintliga övningsnamn.

**Cardio-fält för framtiden** — `cardio_logs` får `avg_heart_rate`, `max_heart_rate`, `pace_sec_per_km`.

**Validering (databasnivå)**
- Pass-längd max 6 timmar, annars flaggas passet
- Vikt och reps får inte vara negativa
- RPE begränsas till 6–10 (fältet finns redan)

## 2. MCP-server

Byggs med `@lovable.dev/mcp-js` och deployas som en edge function. Autentisering via OAuth så coachen kopplar in sig som dig och all data skyddas av befintliga åtkomstregler. Läs- och skrivverktyg hålls separerade så read-only-läge är möjligt.

**P1 – läsverktyg**
- `list_workouts` — `from` (default: senaste 4 veckorna), `to`, `type`, `status`, `limit` (20/max 100), `cursor`. Returnerar id, datum med tidszon, typ, längd i minuter, betyg, status och en kort lista övningsnamn.
- `get_workout` — fullt pass: övningar med muskelgrupper, alla set med vikt, reps, warmup, RPE, samt `target_*` när passet kommer från en plan.
- `get_exercise_history` — `exercise` (id eller namn, alias-upplöst), `from`/`to` (default 6 mån), `include_warmups` (default false). En post per träningsdag med arbetsset, e1RM per dag. För cardioövningar returneras tid, distans, puls och tempo i stället för vikt/reps.

**P2 – skrivverktyg och katalog**
- `create_planned_workout` — datum, typ, titel, anteckningar, övningar med `sets`, `target_reps` (sträng), `target_weight_kg`, anteckningar. Okänt övningsnamn ger ett tydligt fel med närmaste matchning ur katalogen, aldrig en tyst dubblett. Svarar med skapat id.
- `update_planned_workout` / `delete_planned_workout` — endast pass med status `planned`. Genomförda pass kan varken ändras eller raderas via MCP.
- `list_exercises` — katalog med kanoniska id:n, namn, alias, muskelgrupper, utrustning, cardio-flagga.

**P3**
- `get_body_weight` — kroppsviktshistorik i kg för ett datumintervall.
- `get_week_summary` — volym per muskelgrupp per vecka.

Alla verktygsbeskrivningar skrivs i klarspråk med "använd när…", eftersom det är dem coachen väljer verktyg utifrån. Svaren är kompakt JSON, metriska enheter, ISO 8601 med tidszon, paginering på alla listor.

## 3. App-UI

- **Planerade pass i kalender/historik** — planerade pass visas med egen markering, går att öppna, redigera målvärden och starta som ett riktigt pass (mål förifyllda per set).
- **Planeringsvy** — kommande planerade pass listade från idag och framåt, med skapa/redigera/ta bort.
- **Under passet** — målvikt och målreps visas som referens vid varje övning när passet kom från en plan.
- **Kroppsvikt** — snabb inmatning i profilen och en viktkurva på statistiksidan.
- **Bekräftelse vid orimlig vikt** — om ett set loggas mer än ~50 % över tidigare rekord i övningen krävs en bekräftelse.
- **Alias-hantering** — vid skapande av egen övning föreslås matchande befintlig övning i stället för dubblett.

## 4. Ordning

1. Databasmigrering (status, målvärden, kroppsvikt, alias, cardio-fält, validering)
2. MCP-server med P1-verktygen + OAuth-inloggning
3. P2 skrivverktyg + katalog
4. App-UI för planerade pass och kroppsvikt
5. P3-verktyg
6. Acceptanstest: passlista förra veckan, squat-historik utan dubbletter, skapa söndagens benpass, se mål vs utfall efteråt

## Tekniska detaljer

- MCP-servern bor i `src/lib/mcp/` (ett verktyg per fil) och byggs automatiskt till en edge function via Vite-pluginen från `@lovable.dev/mcp-js`.
- Auth: Supabase OAuth 2.1 som authorization server + en consent-sida på `/.lovable/oauth/consent`. Verktygen kör med din användares behörighet, så radnivåsäkerheten gäller precis som i appen.
- Alias-upplösning delas mellan MCP och appens befintliga `exercise-matcher` så namnmatchningen blir identisk på båda hållen.
- `status` backfillas från `is_active` och `ended_at` så befintlig historik får rätt värde; `is_active` behålls tills all kod är omskriven.
