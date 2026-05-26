# Attendance Tenancy

Attendance Tenancy is the platform console for managing tenants, tenant owners, platform settings, and organization-level access.

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

4. Start the tenancy app:

```bash
npm run dev
```

The app runs on `http://localhost:3003`.

## Seeded Login

Use a seeded account with tenant-management permissions:

```text
admin@example.com / password123
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

The Playwright config builds the app and starts `next start` on port `3003`. The API must be running and seeded because login and tenant tables are verified through the real backend.

Useful test environment overrides:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3003
NEXT_PUBLIC_API_URL=http://localhost:3001
E2E_TENANCY_EMAIL=admin@example.com
E2E_TENANCY_PASSWORD=password123
```

## Covered UI Flows

- Login redirect for protected pages.
- Login form validation.
- Authenticated overview, tenants, create tenant, owners, and settings screens.
- Create tenant form validation before submission.

## Project Notes

- Routes are localized under `/en` and `/km`.
- API calls are proxied through `/api/*` so auth cookies remain HTTP-only.
- The default port is `3003`.
