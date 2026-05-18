# Attendance Platform

Turborepo monorepo for an event attendance system with a NestJS API, admin console, attendee QR scan app, shared types, Swagger API docs, and Playwright e2e coverage.

## Apps

- `apps/api` - NestJS API with Prisma, JWT auth, formatted responses/errors, and Swagger.
- `apps/admin` - Next.js admin console using axios, TanStack Query, nuqs, and protected proxy auth.
- `apps/attendance` - Next.js attendee scan app using nuqs for URL-backed scan search.
- `packages/shared` - shared locale and domain helpers.

## Requirements

- Node.js `>=20.19.0`
- pnpm `10.11.0`
- MySQL 8.x

## Environment

Create local env files from the example:

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL` - MySQL connection used by Prisma.
- `JWT_SECRET` - strong secret for access tokens.
- `JWT_REFRESH_SECRET` - separate strong secret for refresh tokens.
- `JWT_ACCESS_EXPIRES_IN` - default `15m`.
- `JWT_REFRESH_EXPIRES_IN` - default `7d`.
- `SWAGGER_ENABLED` - set to `false` to disable Swagger in production.
- `SWAGGER_PATH` - default `api/docs`.
- `NEXT_PUBLIC_API_URL` - API origin for Next apps.
- `ATTENDANCE_APP_URL` - public attendee app URL used when generating QR links.
- `ADMIN_APP_URL` - admin app URL used by Playwright and deployments.

## Setup

```bash
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Default local ports:

- Attendance app: `http://localhost:3000`
- API: `http://localhost:3001/api`
- Swagger UI: `http://localhost:3001/api/docs`
- Swagger JSON: `http://localhost:3001/api/docs/json`
- Admin app: `http://localhost:3002`

## API Contract

All successful API responses are wrapped:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "timestamp": "2026-05-18T03:00:00.000Z",
  "path": "/api/example"
}
```

All API errors are formatted for frontend use:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": ["name must be a string"]
  },
  "statusCode": 400,
  "timestamp": "2026-05-18T03:00:00.000Z",
  "path": "/api/example"
}
```

Use Swagger for complete request/response examples:

```bash
open http://localhost:3001/api/docs
```

Auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Protected endpoints require `Authorization: Bearer <accessToken>`. Public endpoints are QR event lookup and QR attendance join.

## Admin Frontend

The admin app uses:

- axios client at `apps/admin/src/lib/api.ts`
- TanStack Query provider at `apps/admin/src/components/providers/query-provider.tsx`
- nuqs adapter in the root locale layout
- protected auth refresh in `apps/admin/src/proxy.ts`
- private route components under `_components` so Next.js does not create pages from them

Admin authentication stores access and refresh tokens in HTTP-only cookies. The proxy refreshes access tokens when possible and redirects to `/:locale/login` when a session cannot be refreshed.

Refresh tokens are stored server-side as SHA-256 hashes in the `RefreshToken` Prisma model. Login creates a token row, refresh rotates and revokes the previous row, and logout revokes the current row.

## Attendance Frontend

The scan app uses `nuqs` for URL-backed search state. On pre-registered events, the name search is stored in `?q=` so the attendee can refresh or share the same state.

Main scan flow:

1. Load public event by QR code.
2. Search pre-registration rows when the event mode is `PRE_REGISTERED`.
3. Collect manual details when needed.
4. Request geolocation permission.
5. Submit attendance to `POST /api/attendance/qr/:code/join`.
6. API checks distance against event radius before creating attendance.

## Excel Upload Format

The pre-registration upload expects the first sheet to contain:

```text
Fullname English, Fullname Khmer, Gender, Position, Department
```

`Gender` accepts `male`, `female`, or `other`.

## TypeScript

The workspace uses `tsconfig.base.json` with app-level overrides:

- API: CommonJS, Node resolution, decorator metadata, `rootDir: src`, `outDir: dist`.
- Admin: Next.js config with `@/*` and `@attendance/shared` aliases.
- Shared package: `NodeNext` module and resolution.

Run checks:

```bash
pnpm --filter @attendance/api lint
pnpm --filter @attendance/admin lint
pnpm --filter @attendance/attendance lint
```

## Playwright

E2E tests live in `tests/e2e`:

- `api.spec.ts` checks Swagger JSON and formatted validation errors.
- `admin.spec.ts` checks auth redirect and login error handling.
- `attendance.spec.ts` checks QR scan search with nuqs.

Run:

```bash
pnpm test:e2e
pnpm test:e2e:ui
```

Playwright starts the API, admin, and attendance dev servers automatically unless an existing server is already running.

## Production Checklist

- Use Node.js `>=20.19.0`.
- Set strong, different `JWT_SECRET` and `JWT_REFRESH_SECRET` values.
- Set `SWAGGER_ENABLED=false` if docs should not be public.
- Set production `NEXT_PUBLIC_API_URL`, `ATTENDANCE_APP_URL`, and `ADMIN_APP_URL`.
- Run `pnpm db:migrate` during deployment.
- Serve apps behind HTTPS so secure cookies are enabled.
