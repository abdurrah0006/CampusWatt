# CampusWatt

**Find the energy your campus wastes, see it hour by hour, and know what to fix.**

Built for **Hackathon Competition 2026: AI Solutions for Energy Optimization toward Smart Campuses** (Liwa University, UAE).

> **Prototype · simulated data.** CampusWatt is a hackathon prototype. Every reading comes from a deterministic generator (`backend/src/data/generator.js`). No real sensors, meters or utility data are connected. The app shows a "Prototype · simulated data" badge in the sidebar footer.

CampusWatt is a MERN web app with two connected features:

| | Feature | What it does |
|---|---|---|
| **A** | **Energy Waste Finder** | Flags rooms that use a lot of power while nothing is scheduled, shows *"You could save X AED/month"*, and writes a specific recommendation per room. |
| **B** | **Building Energy Dashboard** | Hourly charts for 5 buildings, the week's highest consumer, red alerts when a building passes its limit, and a 24-hour forecast. |

---

## Contents
- [Features](#features)
- [Architecture](#architecture)
- [Quick start (3 commands)](#quick-start-3-commands)
- [MongoDB options](#mongodb-options)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API reference](#api-reference)
- [How the logic works](#how-the-logic-works)
- [Demo walkthrough (3-5 min)](#demo-walkthrough-35-min)
- [Managing buildings, rooms and schedules](#managing-buildings-rooms-and-schedules)
- [Theme and design tokens](#theme-and-design-tokens)
- [Adding readings (future sensors)](#adding-readings-future-sensors)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Screenshots](#screenshots)

---

## Features

- **Waste detection**: hour-by-hour check of usage against each room's baseline and class timetable.
- **AED savings**: monthly savings with an editable tariff (default **AED 0.38/kWh**, clearly labelled as an assumption).
- **Smart Recommendations**: a rule-based engine that works offline and needs no API key. It writes room-specific advice with a cause, an action tag and a priority. An LLM can rewrite the text if you add a key, and it falls back to the rule-based text automatically.
- **Alerts**: hourly and daily limits per building, with *warning* (above 90%) and *critical* (above 100%) levels and a dismissible red banner.
- **Forecast**: the next 24 hours, each hour forecast as the average of the same hour over the previous 7 days. No ML training.
- **Demo-safe**: if MongoDB is down or empty, the API serves the same data from JSON in memory with the **same response shape**. If MongoDB drops mid-demo, it switches over automatically.
- **IoT-ready**: `POST /api/energy/ingest` with an API key and Zod validation, ready for Arduino/ESP32 meters.
- **Polished UI**: skeleton loaders, empty and error states with retry, toasts, auto-refresh without flicker, responsive layout, keyboard accessible.

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[React + Vite<br/>Tailwind, Recharts]
  end
  subgraph API[Express API /api]
    R[Routes + Zod validation] --> C[Controllers]
    C --> A[analytics.js<br/>orchestration]
    A --> S[Pure services<br/>wasteDetection · savings · alerts<br/>forecast · consumption · recommendation]
    A --> DS[dataStore facade]
  end
  DS -->|primary| M[(MongoDB)]
  DS -->|fallback| J[(JSON in memory<br/>src/data/*.json)]
  S -.optional.-> LLM[LLM provider<br/>5s timeout → rule-based]
  IoT[ESP32 / Arduino meters] -->|POST /api/energy/ingest<br/>x-api-key| R
  UI -->|axios| R
```

```
campuswatt/
├── README.md, package.json (root scripts), .gitignore
├── scripts/setup-env.js          creates .env files from the examples
├── backend/
│   ├── server.js                 loads env, initialises data store, starts server
│   ├── src/
│   │   ├── app.js                middleware wiring (helmet, cors, morgan, rate limit)
│   │   ├── config/               env.js, db.js, constants.js
│   │   ├── models/               Building, Room, Schedule, EnergyReading
│   │   ├── repositories/         dataStore (facade), mongoRepository, jsonRepository
│   │   ├── controllers/          building, room, energy, dashboard, waste, recommendation, health
│   │   ├── routes/               one file per resource + index.js
│   │   ├── services/             wasteDetection, savings, alerts, forecast, consumption,
│   │   │                         recommendation (+ providers/ruleBased, providers/llm), analytics
│   │   ├── middleware/           errorHandler, notFound, validate, rateLimiter, asyncHandler, requireApiKey
│   │   ├── validators/           Zod schemas
│   │   ├── utils/                apiResponse, ApiError, logger, dateHelpers, math
│   │   └── data/                 generator.js + generated JSON (fallback data)
│   ├── scripts/                  generateData.js, seed.js
│   └── tests/                    unit tests (services) + integration tests (routes)
└── frontend/
    └── src/
        ├── api/                  axios client + endpoint functions
        ├── components/           layout/, ui/, charts/, dashboard/, waste/
        ├── pages/                Dashboard, WasteFinder, Buildings, Settings, NotFound
        ├── hooks/                useApi, useInterval, useToast, useCountUp, useDocumentTitle
        ├── context/              SettingsContext (tariff, threshold), DataRefreshContext
        ├── utils/                formatters (AED, kWh, dates), constants
        └── styles/index.css      Tailwind layers + design tokens
```

**Changes from the brief's structure, and why:**
- `repositories/` was added so MongoDB and the JSON fallback share one interface. Controllers never know which one is active, which is what keeps the response shape identical in both modes.
- `services/analytics.js` loads the data and calls the pure services, so the business rules stay free of database code and are easy to unit-test.
- `services/consumption.js` holds the "highest consumer" and "today vs. yesterday" logic.
- A `server` room type was added because the brief asks for server rooms with a higher baseline.

## Quick start (3 commands)

**Prerequisites:** Node.js 18.17+ (20 LTS recommended) and npm. MongoDB is optional (see below).

```bash
npm run setup     # installs root, backend and frontend; creates .env files; generates data
npm run seed      # loads data into MongoDB (skip it if you have no MongoDB; the app still works)
npm run dev       # API on http://localhost:5000, web app on http://localhost:5173
```

Open **http://localhost:5173**.

> **Single-port demo mode:** `npm run demo` builds the frontend and serves everything from **http://localhost:5000**. That is one process with no dev server, which is the safest option on a projector laptop.

## MongoDB options

**Option 1: Local MongoDB**
- Install [MongoDB Community Server](https://www.mongodb.com/try/download/community), or use Docker: `docker run -d -p 27017:27017 --name campuswatt-mongo mongo:7`
- Keep the default `MONGO_URI=mongodb://127.0.0.1:27017/campuswatt`

**Option 2: MongoDB Atlas (free M0 tier)**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under *Database Access*, create a user. Under *Network Access*, allow your IP (or `0.0.0.0/0` for the demo).
3. Click *Connect → Drivers* and copy the connection string into `backend/.env`:
   `MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/campuswatt?retryWrites=true&w=majority`
4. Run `npm run seed`.

**Option 3: No database.** Set `DATA_SOURCE=json`, or just leave MongoDB off. The API logs a warning and serves the built-in dataset. The top bar shows an "Offline dataset" badge.

## Environment variables

`backend/.env` (created from `backend/.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `CORS_ORIGIN` | `*` | Allowed origins (comma-separated) |
| `DATA_SOURCE` | `mongo` | `mongo` (with automatic JSON fallback) or `json` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/campuswatt` | Local or Atlas connection string |
| `MONGO_TIMEOUT_MS` | `3000` | How long to wait for MongoDB at startup before falling back |
| `TARIFF_AED_PER_KWH` | `0.38` | Default tariff (an **assumption**; can also be edited in the UI) |
| `HIGH_USAGE_MULTIPLIER` | `1.5` | An hour is "high" if kWh > baseline × this value |
| `WASTE_WINDOW_HOURS` | `24` | Hours analysed by the Waste Finder |
| `MIN_WASTE_HOURS` | `2` | Waste hours needed to flag a room |
| `FORECAST_LOOKBACK_DAYS` | `7` | Days averaged for the forecast |
| `ALERT_WARNING_RATIO` | `0.9` | Warning above 90% of the limit |
| `DAILY_LOAD_FACTOR` | `0.7` | Daily limit = hourly threshold × 24 × this factor |
| `CAMPUS_UTC_OFFSET_HOURS` | `4` | UAE time (no daylight saving) |
| `INGEST_API_KEY` | random (from setup) | Required `x-api-key` header for sensor ingestion |
| `LLM_API_KEY` | *(empty)* | Optional. Enables the LLM recommendation provider |
| `LLM_MODEL` | `claude-haiku-5-5` | Model used when `LLM_API_KEY` is set |
| `LLM_TIMEOUT_MS` | `5000` | LLM timeout before falling back to rule-based text |

`frontend/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `/api` | API base URL. `/api` uses the Vite proxy in development |
| `VITE_PROXY_TARGET` | `http://localhost:5000` | Where the dev server proxies `/api` |

## Scripts

From the **project root**:

| Command | What it does |
|---|---|
| `npm run setup` | Installs everything, creates `.env` files, generates data |
| `npm run dev` | Backend (nodemon) and frontend (Vite) together |
| `npm run dev:json` | Same, but forces the JSON data source |
| `npm run generate` | Regenerates `backend/src/data/*.json` ending at the current hour |
| `npm run seed` | Wipes and reseeds MongoDB (`seed.js --reset`). Regenerates stale data first |
| `npm run data:reset` | Deletes `backend/src/data/runtime-overrides.json`, so JSON mode goes back to the generated data |
| `npm test` | Jest + Supertest backend tests |
| `npm run demo` | Builds the frontend and serves the whole app on port 5000 |

In `backend/`: `npm run dev`, `npm start`, `npm run seed` (without reset), `npm run seed:reset`, `npm run generate`, `npm run data:reset`, `npm test`.

## API reference

Every response uses the same envelope:

```json
{ "success": true, "data": { }, "error": null, "meta": { "dataSource": "mongo", "generatedAt": "…" } }
```

Errors return `success: false` with `error: { code, message, details? }` and a proper status code: 400 (validation), 401 (API key), 404 (unknown ID), 409 (duplicate code, overlapping class or blocked delete), 422, 429, 500, 503 (write while MongoDB is configured but offline).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Status, active data source, recommendation provider, ingest enabled |
| GET | `/api/buildings` | Buildings with thresholds and room counts |
| POST | `/api/buildings` | Create a building: `{ code, name, floors, thresholdKwhPerHour }` |
| GET | `/api/buildings/:id` | One building with its room count |
| PUT | `/api/buildings/:id` | Update a building (same body as create) |
| DELETE | `/api/buildings/:id?cascade=true` | Delete a building. Returns 409 if it has rooms, unless `cascade=true` |
| GET | `/api/rooms?buildingId=` | Rooms, optionally filtered by building |
| POST | `/api/rooms` | Create a room: `{ code, name, buildingId, floor, type, areaM2, baselineKw }` |
| GET | `/api/rooms/:id` | One room |
| PUT | `/api/rooms/:id` | Update a room |
| DELETE | `/api/rooms/:id` | Delete a room with its schedules and readings |
| GET | `/api/schedules?roomId=&buildingId=` | Class sessions, sorted by day and start hour |
| POST | `/api/schedules` | Create a class session: `{ roomId, dayOfWeek (0 = Sunday), startHour, endHour, courseName }`. Overlaps in the same room return 409 |
| PUT | `/api/schedules/:id` | Update a class session |
| DELETE | `/api/schedules/:id` | Delete one class session |
| GET | `/api/energy/building/:id?from=&to=&granularity=hour\|day` | Time series for one building |
| GET | `/api/dashboard/summary?tariff=&thresholdMultiplier=` | KPIs, highest consumer, alerts, building cards, weekly totals, 24h hourly series |
| GET | `/api/dashboard/forecast?buildingId=` | 24h history + 24h forecast (omit `buildingId` for the whole campus) |
| GET | `/api/dashboard/alerts?thresholdMultiplier=` | Active alerts + per-building status |
| GET | `/api/waste?tariff=` | All rooms with waste status, flagged-room details, campus savings totals |
| POST | `/api/recommendations` | Body `{ "roomIds": ["room-eng-101"], "tariff": 0.38 }` returns `{ source: "ai" \| "rule-based", items: [...] }` |
| POST | `/api/energy/ingest` | Sensor endpoint (`x-api-key` header). Body: one reading or an array |

## How the logic works

All rules live in `backend/src/services/` as pure functions with unit tests.

**Waste detection** (`wasteDetection.js`). For each room, each hour in the last 24h:
`isScheduled` = a timetable block covers that weekday and hour · `isHigh` = kWh > baseline × 1.5 · **waste hour** = isHigh AND NOT isScheduled.
A room is **flagged** with 2 or more waste hours. `wasteKwh` = Σ(kWh − baseline) over the waste hours, and the peak waste hour is reported too.

**Savings** (`savings.js`). daily waste = wasteKwh scaled to 24h → × 30 days → × tariff. The campus total is the sum over flagged rooms. The frontend recalculates AED from kWh, so tariff changes apply instantly.

**Alerts** (`alerts.js`). Each building is checked on its **latest hour** against `thresholdKwhPerHour` and on its **last 24h** against the daily limit (threshold × 24 × 0.7). The worse ratio wins. Above 90% is a **warning**; above 100% is **critical**. The Settings multiplier scales every limit.

**Highest consumer** (`consumption.js`). The sum of the last 168 hours per building, sorted, with share of campus and week-over-week change.

**Forecast** (`forecast.js`). For each of the next 24 hours, the forecast is the mean kWh at the same hour on each of the previous 7 days. The last actual point also carries the forecast value, so the dashed line joins the solid one.

**Recommendations** (`recommendation.js`). The rule engine maps *room type × waste time-profile* (evening / overnight / weekend / daytime) to a likely cause and an action tag. It then writes 2–3 sentences with the room's real numbers, with wording that varies by room. Priority is **High** at ≥ AED 400/month or ≥ 8 waste hours, **Medium** at ≥ AED 150 or ≥ 4 hours, and **Low** otherwise. If `LLM_API_KEY` is set, the LLM rewrites only the text, and any error, timeout or invalid JSON falls back silently. The UI labels it "Smart Recommendation" and says "Rule-based" or "AI-assisted" accurately.

### Fake data (`backend/src/data/generator.js`)
- 5 buildings, 20 rooms (lecture halls, labs, offices, library spaces, a server room) and 129 weekly timetable blocks. The UAE work week runs Mon–Thu with a light Friday and Sat–Sun off.
- 14 days of hourly readings up to the current hour. Usage is higher during classes and in the afternoon heat, lower at night, and labs and the server room have higher baselines.
- **Six deliberate waste cases:** AC left on after the last class (ENG-101), robotics rigs on overnight (ENG-204), auditorium HVAC in the evening (BUS-G01), reading-hall lights overnight (LIB-G10), fume hoods overnight (SCI-110), and conference-hall AC on weekends (ADM-G05).
- Thresholds are calibrated so **Science Labs is always critical** and Engineering sits in the warning band.
- Seeded hashing (`mulberry32` over room + hour) makes the output reproducible.
- **Always fresh:** if the JSON data is more than 2 hours old, the API regenerates it in memory aligned to "now", and `npm run seed` refreshes it before loading. *Tested: every hour of a full week has ≥ 4 flagged rooms and a critical alert.*

## Demo walkthrough (3-5 min)

1. **Hook (20s).** "Campuses pay to cool and light empty rooms. CampusWatt finds that waste automatically."
2. **Dashboard (60s).** Point to the **red banner**: *Science Labs is ~14% over its daily limit* → click **Details**. Walk the KPI row: energy today, **highest consumer this week**, active alerts, potential savings. Toggle a building chip on the hourly chart to show its dashed limit line.
3. **Forecast (30s).** "The solid line is actual. The dashed line is the next 24 hours, predicted from the same hour over the past week. No black box." Switch the building in the dropdown.
4. **Waste Finder (90s).** The hero counts up to **"You could save AED ~2,400/month"**. Sort and filter the table, and point out the *Waste* rows with *Scheduled now: No*. Click **Generate Recommendations**. The drawer shows priorities, action tags and AED per room. Click **Copy**.
5. **Settings (30s).** Change the tariff (for example 0.45) and watch the live preview and the sidebar update. Save, then go back to the Waste Finder: the banner has recalculated. Drag the alert multiplier to 120%: the Engineering warning clears.
6. **Future (20s).** Show the **Sensor integration** card: "Any ESP32 meter can POST readings today. The pipeline is ready for real hardware."

> If MongoDB fails on stage, nothing changes for the audience: the badge switches to "Offline dataset" and every screen keeps working.

## Managing buildings, rooms and schedules

The sidebar has a **Manage** area with three pages: Buildings, Rooms and Schedules. Each page has a searchable table, an Add button, Edit and Delete actions, a form with inline validation, toasts, and a confirm dialog that names the item before deleting it.

- **Buildings:** deleting a building that still has rooms warns you and then deletes the rooms, their schedules and readings too.
- **Rooms:** room types are lecture hall (classroom), lab, office, library and server room. A new room has no readings, so it shows **No data yet** on the Waste Finder until readings arrive.
- **Schedules:** filter by building and room. Pick a room to see a weekly grid (days × hours, 07:00 to 22:00). Click an empty cell to add a class at that time, or a booked cell to edit it. Overlapping classes in the same room are rejected with a clear message.

Changes appear on the Dashboard and Waste Finder on the next fetch. Nothing is cached.

**Where changes are saved**

| Mode | Where writes go |
|---|---|
| `DATA_SOURCE=mongo`, MongoDB up | MongoDB |
| `DATA_SOURCE=mongo`, MongoDB down | Reads fall back to JSON. Writes return **503** so the two data sources never drift apart |
| `DATA_SOURCE=json` | Memory, plus a snapshot in `backend/src/data/runtime-overrides.json`. The generated JSON files are never changed |

In JSON mode, once a change is saved the dataset stays at that moment, including the "now" hour. Run `npm run data:reset` before a demo to go back to fresh generated data. After pulling this update, run `npm run seed` once in MongoDB mode, because the server room type is now `server_room`.

## Theme and design tokens

The app opens in **dark mode**. The sun and moon button in the top bar switches themes. The choice is saved in `localStorage` (`campuswatt.theme`) and applied as `data-theme` on `<html>`.

All colors are CSS variables in `frontend/src/styles/index.css`, exposed to Tailwind in `frontend/tailwind.config.js`:

| Tailwind class | Variable | Use |
|---|---|---|
| `bg-canvas`, `bg-surface`, `bg-elevated` | `--bg-primary`, `--bg-surface`, `--bg-elevated` | Page, cards, inputs and table headers |
| `text-ink-primary/secondary/muted` | `--text-*` | Text |
| `bg-brand-primary`, `text-brand-secondary` | `--brand-primary`, `--brand-secondary` | Buttons, savings, links, focus rings, chart lines |
| `bg-energy-optimal/moderate/critical/info` | `--status-*` | Status fills (bars, dots) |
| `text-energy-*-ink` | `--status-*-text` | Status text that passes WCAG AA |
| `border-line` | `--border-subtle` | Borders and grid lines |

Notes:
- `--text-muted` is slightly darker in light mode (`#5F7366`) and lighter in dark mode (`#7F98B2`) than first planned, so small text passes WCAG AA (4.5:1).
- Status colors are never the only signal: badges and meters always add an icon and a label (Optimal, Moderate, High, Warning, Critical).
- Building lines use `--series-1` to `--series-5`, checked for color-blind separation in both themes. Charts read the variables with `getComputedStyle` and re-read them when the theme changes.
- Icons all come from lucide-react through `components/ui/Icon.jsx` (16, 20 or 24 px, stroke 1.75, round caps).

The top bar shows a **live clock** in UAE time (Asia/Dubai). Only the clock re-renders every second, so charts do not flicker. The backend uses the same UTC+4 offset for "scheduled now" and the forecast's "Now" marker.

## Adding readings (future sensors)

This prototype uses simulated data. The ingest endpoint shows how real meters, such as an Arduino or ESP32 with a PZEM-004T or SCT-013 clamp, could send readings in a future version. You can also use it today to add test readings for a new room:

```
POST /api/energy/ingest
Headers: Content-Type: application/json
         x-api-key: <INGEST_API_KEY from backend/.env>
Body:    { "roomId": "room-eng-101", "kwh": 0.85, "timestamp": "2026-11-17T09:15:00Z" }
     or  [ { …reading… }, { …reading… } ]          (batch, up to 1000)
```

- `kwh` is the energy measured **since the device's last post**. The API adds it to the room's hourly bucket, so posting every 5–15 minutes is fine.
- `timestamp` is optional (it defaults to "now"). Future timestamps, unknown rooms and negative values are rejected (422/400).
- The endpoint is rate-limited per IP (120/min) and uses a constant-time API key check.

Minimal ESP32 sketch (Arduino core, `HTTPClient`):

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* API = "http://<server-ip>:5000/api/energy/ingest";
const char* KEY = "<INGEST_API_KEY>";

void postReading(float kwh) {
  HTTPClient http;
  http.begin(API);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", KEY);
  String body = String("{\"roomId\":\"room-eng-101\",\"kwh\":") + String(kwh, 3) + "}";
  int code = http.POST(body);          // 201 = stored
  http.end();
}
```

Room IDs are listed at `GET /api/rooms`. In production, put the API behind HTTPS and give each device its own key.

## Testing

```bash
npm test
```

There are 9 suites and 74 tests:
- **Unit tests:** waste detection (schedules, thresholds, window, configuration), savings, alerts (severity bands, daily vs. hourly, multiplier, sorting), forecast (averaging, shape, line join, missing data), and recommendations (rule engine plus LLM success, HTTP error, invalid output and timeout fallbacks).
- **Integration tests (Supertest, JSON source):** every endpoint, validation errors, the ingest API key and the error envelope.
- **CRUD tests:** create, read, update and delete for buildings, rooms and schedules, with validation errors (400), unknown IDs (404), duplicate codes (409), overlapping classes (409), the blocked building delete (409), cascades, and saving to the overrides file.
- **Empty data tests:** rooms with no readings, and a campus with no readings at all, still return valid waste, dashboard and forecast results.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Offline dataset" badge / log says *MongoDB unavailable* | Expected without MongoDB. Start MongoDB and run `npm run seed`, or ignore it: everything works on JSON. |
| "database is empty" warning | Run `npm run seed`. |
| Charts end several days ago (MongoDB mode) | The seeded data is old: run `npm run seed` again before the demo. |
| `EADDRINUSE: 5000` | Another process is using the port. Stop it or change `PORT` (and `VITE_PROXY_TARGET`). |
| Frontend shows *Can't reach the CampusWatt API* | Make sure the backend is running (`npm run dev` starts both). |
| Atlas connection times out | Add your IP under *Network Access* and check the user and password in `MONGO_URI`. |
| Ingest returns 503 | Set `INGEST_API_KEY` in `backend/.env` (`npm run setup` does this), or MongoDB is configured but offline. |
| Saving in a Manage page says "The database is offline" | `DATA_SOURCE=mongo` but MongoDB is down. Start MongoDB, or run `npm run dev:json` to save to JSON instead. |
| JSON mode shows old data after edits | Run `npm run data:reset` to clear saved changes. |
| Want AI-written recommendations | Add `LLM_API_KEY` to `backend/.env`. Without it, the rule-based engine is used, by design. |

## Screenshots

**Dashboard**: critical alert banner, KPIs, hourly usage, weekly comparison, forecast, alerts
![Dashboard](docs/screenshots/dashboard.png)

**Waste Finder**: savings hero and sortable/filterable rooms table
![Waste Finder](docs/screenshots/waste-finder.png)

**Smart Recommendations**: per-room actions with priority, action tag and AED impact
![Recommendations](docs/screenshots/recommendations.png)

**Buildings**: per-building status, 24h sparkline against the hourly limit, daily limit usage
![Buildings](docs/screenshots/buildings.png)

---

*Tariff note: AED 0.38/kWh is an editable assumption for illustration. Actual commercial and education rates depend on the utility (DEWA, ADDC/TAQA, SEWA, EtihadWE) and the tariff band.*
