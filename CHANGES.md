# CampusWatt update: all parts

This zip is the whole project with Parts 1 to 5 applied. Unzip it in place of your old folder, keeping your own `backend/.env` and `frontend/.env`, then run `npm run setup` (or `npm install` in both folders) and `npm run dev`.

No new npm packages were added.

## Decisions

- **Writes while MongoDB is down:** if `DATA_SOURCE=mongo` and MongoDB is offline, reads fall back to JSON and writes, including ingest, return 503. This keeps the two data sources from drifting apart.
- **JSON saves:** in JSON mode, saved changes freeze the dataset at that moment. Run `npm run data:reset` before a demo.
- **Contrast fixes:** the spec's `--text-muted` failed WCAG AA, so it is `#5F7366` in light mode and `#7F98B2` in dark mode. Status colors stay as given for fills. Text uses new darker `--status-*-text` tokens in light mode.

## Part 1: backend CRUD

New: `validators/crudSchemas.js`, `services/crudGuards.js`, `services/scheduleRules.js`, `controllers/scheduleController.js`, `routes/scheduleRoutes.js`, `utils/makeId.js`, `scripts/resetRuntimeData.js`, `tests/crud.test.js`, `tests/scheduleRules.test.js`, `tests/emptyCampus.test.js`.

Changed: both repositories, `dataStore.js`, building and room controllers and routes, `routes/index.js`, `ApiError.js`, `errorHandler.js`, `config/constants.js`, `data/generator.js` and the generated JSON (`server` is now `server_room`), `ruleBasedProvider.js`, `services/analytics.js` (rooms show "No data yet" even when the campus has no readings), both `package.json` files, `.gitignore`.

Verify: `npm test` shows 9 suites and 74 tests passing.

## Part 2: tokens, theme, icons, logo

New: `context/ThemeContext.jsx`, `components/ui/Icon.jsx`, `components/ui/ThemeToggle.jsx`, `components/layout/BrandLogo.jsx`, `hooks/useChartColors.js`.
Changed: `styles/index.css`, `tailwind.config.js`, `index.html`, `public/favicon.svg`, `main.jsx`.

Verify: the app opens dark. The sun button switches to light, and a reload keeps the choice. The browser tab shows a bulb icon.

## Part 3: live clock and top bar

New: `components/layout/LiveClock.jsx`, `components/layout/DataFreshness.jsx`, `components/layout/SidebarLink.jsx`.
Changed: `Topbar.jsx`, `Sidebar.jsx` (Manage section and "Prototype · simulated data" badge), `PageContainer.jsx`.

Verify: the clock in the middle of the top bar ticks every second in UAE time. On a phone-width window, it shows only HH:MM. A green dot means "Live"; an amber dot means "Offline dataset" or "API offline".

## Part 4: Manage pages

New: `pages/manage/ManageBuildingsPage.jsx`, `ManageRoomsPage.jsx`, `ManageSchedulesPage.jsx`, the `components/manage/` folder, `components/ui/Modal.jsx`, `ConfirmDialog.jsx`, `FormField.jsx`, `SearchInput.jsx`, `IconButton.jsx`, `TableSkeleton.jsx`, `utils/formValidation.js`.
Changed: `api/endpoints.js` (adds create, get, update and remove for buildings, rooms and schedules), `api/client.js` (friendlier messages), `App.jsx` (routes).

Verify: under Manage → Schedules, pick BUS-120, click an empty Friday cell, and add a class. Then add a second class that overlaps it. The form shows the 409 message inline. Add a room under Manage → Rooms, and it appears on the Waste Finder as "No data yet".

## Part 5: re-theme and accessibility

New: `components/ui/UsageMeter.jsx` (Optimal, Moderate and High levels with an icon, a label and a %), `utils/usageLevel.js`, `utils/chartStyles.jsx`, `utils/copyText.js`, `components/buildings/`, `components/settings/`, plus small split-out components (`AlertDetailCard`, `DeltaBadge`, `BuildingChips`, `RecommendationCard`, `RoomStatusBadge`, `SortableHeader`, `SavingsStat`, `CardHeader`, `CardSkeleton`, `ChartSkeleton`).
Changed: every chart, dashboard, waste and UI component, and every page. No hard-coded hex colors are left in components.

Verify: switch themes on the Dashboard. Chart lines, grid, axis text and tooltips all change. Every status shows an icon and a word, not only a color.

## Regression checklist

| Check | Result here |
|---|---|
| Existing tests pass | 74 of 74 (43 original + 31 new) |
| Waste list and savings match | 5 flagged rooms, AED 2,483/month at 0.38 (same rules as before) |
| Alerts show | 3 critical alerts in the banner and list |
| Forecast renders | Yes, with "Now (UAE)" marker and dashed forecast |
| Recommendations without an API key | Rule-based source, no error |
| JSON fallback with MongoDB off | Reads work, writes return 503 when Mongo is configured |
| Both themes look right | Checked in headless Chrome, no console errors |
| Clock ticks without chart flicker | Only LiveClock and DataFreshness re-render each second |
| CRUD changes reach Waste Finder and Dashboard | New room shows on Waste Finder on the next fetch |
| MongoDB writes | Not tested live (no MongoDB in the build sandbox). Test once with your database and run `npm run seed` |
