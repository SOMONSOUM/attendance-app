# Attendance App

Attendance App is the public QR scanning experience for attendees and meeting participants. It renders event QR pages, meeting QR pages, search flows, open registration forms, and participant check-in screens.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the API from `attendance-api`, run migrations, and seed data:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

3. Create `.env.local` when the API is not on the default URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the app:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Seeded QR Codes

Event QR codes:

```text
DEMO-TECH-SUMMIT-2026
DEMO-EXPO-MAIN-HALL
DEMO-EXPO-WORKSHOP
DEMO-COMMUNITY-OPEN-DAY-2026
DEMO-DEVELOPER-CLINIC-2026
```

Meeting QR codes:

```text
DEMO-BOARD-BRIEFING-2026
DEMO-MEETING-POLICY-ROOM
DEMO-MEETING-BUDGET-ROOM
DEMO-PUBLIC-TOWNHALL-2026
DEMO-RESEARCH-ROUNDTABLE-2026
```

## UI Tests

Install Playwright browsers once:

```bash
npx playwright install
```

Run the full UI suite:

```bash
npm run test:ui
```

Run with the browser visible:

```bash
npm run test:ui:headed
```

Open the last HTML report:

```bash
npm run test:ui:report
```

The Playwright config starts the Next dev server on port `3000`. The API must be running and seeded because QR pages are server-rendered from real API data.

Useful test environment overrides:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Covered UI Flows

- Localized public entry route.
- Seeded bulk event QR page and attendee search.
- Seeded open registration event page and required form state.
- Seeded meeting QR page and participant filtering.
- Seeded pre-registration meeting page.
- Desktop Chromium and mobile Chromium viewports.

## Project Notes

- Routes are localized under `/en` and `/km`.
- API calls go directly to `NEXT_PUBLIC_API_URL`.
- The default port is `3000`.
