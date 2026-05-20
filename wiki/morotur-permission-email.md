# Morotur permission email — draft

**Status:** Sent 2026-05-20 from altukaleksandr2020@gmail.com to petter.jenset@mrfylke.no (cc post@mrfylke.no). Awaiting reply.

## Contact verification

- **Primary recipient:** Petter Jenset, rådgivar friluftsliv, Møre og Romsdal fylkeskommune
- **Email:** petter.jenset@mrfylke.no
- **Phone:** 71 28 03 05 / mobil 92 23 42 44
- **General mailbox (cc):** post@mrfylke.no
- **Sources checked (2026-05-20):**
  - https://morotur.no/om-morotur — lists Petter Jenset as Morotur-kontakt, email petter.jenset@mrfylke.no
  - https://mrfylke.no/tenester/kultur-idrett-og-friluftsliv/friluftsliv — same person listed as rådgivar friluftsliv, same direct number
- **Recommendation:** send primary to petter.jenset@mrfylke.no, sett post@mrfylke.no på kopi som arkivinstans.
- **Uncertainty:** ingen motstrid mellom kildene. Begge bekrefter samme kontakt.

---

## 1. Norwegian email (primary — send this)

**Til:** petter.jenset@mrfylke.no
**Kopi:** post@mrfylke.no
**Emne:** Forespørsel om bruk av Morotur-data i ny gratis turapp (NærTur)

Hei Petter,

Mitt navn er Oleksandr Altukhov. Jeg er en soloutvikler bosatt i Norge, og jeg holder på å bygge en liten, gratis turapp som heter NærTur. Jeg tar kontakt fordi appen er helt avhengig av turdataene Møre og Romsdal fylkeskommune publiserer gjennom Morotur, og jeg vil gjerne be om skriftlig tillatelse til å bruke dem før jeg lanserer noe offentlig.

NærTur er tenkt som en enkel anbefalingsmotor for tur: du åpner appen, trykker én gang, og får forslag om én tur i nærheten som passer for deg i dag — gitt værmelding, sesong, og dine egne filtre for vanskelighetsgrad, lengde og reisetid. Det er ingen innlogging, ingen reklame, ingen analyse, og ingen abonnementsmodell. Tanken er at appen skal fjerne valgangst, ikke konkurrere med eksisterende turdatabaser. MVP-en lanseres for Møre og Romsdal først, og holdes bevisst liten i starten.

Konkret ber jeg om tillatelse til å hente `Fotturer`-laget fra `kart.gislink.no/arcgis/.../Morotur/MapServer`, med full kildehenvisning og deep-link tilbake til den enkelte turen på morotur.no. Jeg forplikter meg til følgende:

- synlig kildehenvisning "Tur-data fra morotur.no, Møre og Romsdal fylkeskommune" på hvert turkort og i appens "Om"-side
- direkte lenke tilbake til turens egen side på morotur.no fra hvert kort
- kun et kort sammendrag i appen, ikke gjengivelse av full ruteomtale
- ansvarlig caching av data, slik at API-et ikke blir hamret unødvendig
- umiddelbar stans dersom fylkeskommunen ber om det, uten diskusjon
- åpen for å signere en formell bruksavtale dersom dere ønsker det

For Morotur tror jeg dette kan være en fin ting: NærTur sender brukere tilbake til morotur.no for den fulle turbeskrivelsen, og når en ny målgruppe — folk som ikke leter aktivt, men som vil ha et dytt ut døra. Appen er en anbefalingsmotor, ikke en turdatabase, så den konkurrerer ikke med innholdet dere allerede har bygget.

Jeg tar gjerne en kort prat på telefon eller en lengre demo hvis det er nyttig. Uansett vil jeg helst ha noe skriftlig fra dere før jeg lanserer.

Takk for at du leser, og for arbeidet dere gjør med Morotur.

Vennlig hilsen
Oleksandr Altukhov
altukaleksandr2020@gmail.com

---

## 2. English email (backup — for internal review only)

**To:** petter.jenset@mrfylke.no
**Cc:** post@mrfylke.no
**Subject:** Request for permission to use Morotur data in a new free hiking app (NærTur)

Hi Petter,

My name is Oleksandr Altukhov. I am a solo developer based in Norway, and I am building a small, free hiking app called NærTur. I am reaching out because the app depends entirely on the hiking data Møre og Romsdal fylkeskommune publishes through Morotur, and I would like to ask for written permission to use it before I launch anything publicly.

NærTur is meant as a simple recommendation engine for hikes: you open the app, tap once, and get one nearby hike that suits you today — based on the weather forecast, the season, and your own filters for difficulty, length, and travel time. There is no sign-up, no advertising, no analytics, and no paid tier. The intent is to remove decision paralysis, not to compete with existing hiking databases. The MVP will launch for Møre og Romsdal first, and I am keeping it deliberately small to start.

Concretely, I am asking for permission to pull the `Fotturer` layer from `kart.gislink.no/arcgis/.../Morotur/MapServer`, with full attribution and a deep link back to the original hike page on morotur.no. I commit to the following:

- visible attribution "Tur-data fra morotur.no, Møre og Romsdal fylkeskommune" on every hike card and on the app's "About" page
- a direct link back to the hike's own page on morotur.no from each card
- only a short summary in the app, not a reproduction of the full route description
- responsible caching of the data, so the API is not hammered unnecessarily
- immediate shutdown if the county asks me to stop, no discussion
- happy to sign a formal usage agreement if you would like one

I think this could be a good thing for Morotur: NærTur sends users back to morotur.no for the full hike description, and it reaches a new audience — people who are not actively searching, but who want a nudge out the door. The app is a recommendation engine, not a hike database, so it does not compete with the content you have already built.

Happy to take a quick call or give a longer demo if that helps. Either way, I would prefer to have something in writing from you before I launch.

Thank you for reading, and for the work you do on Morotur.

Best regards,
Oleksandr Altukhov
altukaleksandr2020@gmail.com

---

## 3. NærTur — one-pager

### The problem

Norway has more good hikes than anyone can ever do, and the existing apps all assume you already know where you want to go. UT.no is a catalogue you browse. Stikk UT! is a gamified check-in challenge with a fixed seasonal list. AllTrails and Komoot are route planners built for people who arrive with a plan. Morotur is a high-quality regional database, but it is still a database — it answers "what hikes exist near Ålesund?", not "give me one safe hike near me right now." For most people on a normal Saturday morning, the bottleneck is not lack of options, it is decision paralysis. Friends cancel, weather flips, the kids are restless, and forty minutes later you are still scrolling instead of walking.

### The solution

NærTur is a free PWA. You open it, tap "Finn tur," and get one nearby hike that fits today's conditions, the current season, and your filters (difficulty, length, drive-time, available transport). Three actions on the result screen: **Start** (open the hike), **Velg en annen** (re-roll), **Ikke min tur** (mark it as a bad fit so it does not return). Behind the scenes, NærTur layers MET weather, NVE avalanche bulletins, and the user's saved filters on top of the source hike data, then picks one. The app is a randomizer with safety rails, not a planner.

### Principles

- free forever — no paid tier, no ads, no in-app purchases
- no accounts, no email, no sign-up
- no analytics, no third-party tracking
- no LLM dependency in the recommendation path — deterministic filters only
- safety before randomness — weather and avalanche gates run before the roll
- preferences stored locally on the device, never on a server
- full attribution to every data source, on every card

### ASCII mockup of the result screen

```
┌──────────────────────────────────────────────┐
│  NærTur                                      │
│                                              │
│   ── Anbefalt i dag ──                       │
│                                              │
│   Romsdalseggen — Åndalsnes                  │
│                                              │
│   Vanskelighet:  ●●●○○  Krevende             │
│   Lengde:        10,1 km                     │
│   Stigning:      970 m                       │
│   Kjøretid:      32 min fra deg              │
│                                              │
│   Vær i dag:     6°C, lett skyet, vind 4 m/s │
│   Sesong-ok:     ja                          │
│                                              │
│   [  Start tur  ]                            │
│   [  Velg en annen  ]                        │
│   [  Ikke min tur  ]                         │
│                                              │
│   Kilde: morotur.no                          │
│   Møre og Romsdal fylkeskommune              │
└──────────────────────────────────────────────┘
```

### FAQ

**Will you ever charge for this?**
No. NærTur has no paid features, no ads, and no plans to add either. If running it ever becomes too expensive for a hobby budget, I would scale it down before I would monetise it.

**Will you scrape Morotur?**
No. I am asking for permission first, and I plan to use the official ArcGIS MapServer endpoint with respectful caching — not browser scraping. If the fylkeskommune prefers a different access path, I will switch.

**Could this conflict with Stikk UT!?**
No. They are different categories. Stikk UT! is a seasonal check-in challenge with a curated list and social proof. NærTur is a randomizer for any day of the year. The two could happily coexist, and NærTur would deep-link to Stikk UT! pages where they exist.

**Will the app be in English too?**
Norwegian first. English UI is planned once the Norwegian experience is solid. Hike content stays in its source language (Norwegian), with attribution to morotur.no — translating route descriptions would compromise accuracy and is not the app's job.
