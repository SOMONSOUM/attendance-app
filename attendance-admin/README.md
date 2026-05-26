# Attendance Admin

Attendance Admin is the tenant-facing operations console for managing events, meetings, registrations, people, roles, attendance logs, QR codes, and event theme settings.

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

4. Start the admin app:

```bash
npm run dev
```

The app runs on `http://localhost:3002`.

## Seeded Login

Use one of these seeded users:

```text
admin@example.com / password123
operator@example.com / password123
viewer@example.com / password123
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

The Playwright config starts the Next dev server on port `3002`. The API must be running and seeded because login and screen data are verified through the real backend.

Useful test environment overrides:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:3001
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=password123
```

## Covered UI Flows

- Login redirect for protected pages.
- Login form validation.
- Authenticated dashboard, events, meetings, registrations, attendance, people, roles, theme, and settings screens.
- Main navigation between key admin sections.

## Project Notes

- Routes are localized under `/en` and `/km`.
- API calls are proxied through `/api/*` so auth cookies remain HTTP-only.
- The default port is `3002`.
