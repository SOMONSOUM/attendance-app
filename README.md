# Attendance Platform

Standalone projects for an event attendance system.

## Projects

- `attendance-api` - NestJS API with Prisma, JWT auth, formatted responses/errors, and Swagger.
- `attendance-admin` - Next.js admin console using axios, TanStack Query, nuqs, and protected proxy auth.
- `attendance-app` - Next.js attendee QR scan app using nuqs for URL-backed scan search.

## Requirements

- Node.js `>=20.19.0`
- pnpm `10.11.0`
- MySQL 8.x

## Environment

Create local env files from each project example:

```bash
cp attendance-api/.env.example attendance-api/.env
cp attendance-admin/.env.example attendance-admin/.env
cp attendance-app/.env.example attendance-app/.env
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
- `ADMIN_APP_URL` - admin app URL used by deployments.

## Setup

Start MySQL from the repository root:

```bash
docker compose up -d
```

Install and run each project separately:

```bash
cd attendance-api
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

```bash
cd attendance-admin
pnpm install
pnpm dev
```

```bash
cd attendance-app
pnpm install
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

Auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Protected endpoints require `Authorization: Bearer <accessToken>`. Public endpoints are QR event lookup and QR attendance join.

## Admin Frontend

The admin app uses:

- axios client at `attendance-admin/src/lib/api.ts`
- TanStack Query provider at `attendance-admin/src/components/providers/query-provider.tsx`
- nuqs adapter in the root locale layout
- protected auth refresh in `attendance-admin/src/proxy.ts`
- private route components under `_components` so Next.js does not create pages from them

Admin authentication stores access and refresh tokens in HTTP-only cookies. The proxy refreshes access tokens when possible and redirects to `/:locale/login` when a session cannot be refreshed.

## Attendance Frontend

The scan app uses `nuqs` for URL-backed search state. On pre-registered events, the name search is stored in `?q=` so the attendee can refresh or share the same state.

Main scan flow:

1. Load public event by QR code.
2. Search pre-registration rows when the event mode is `PRE_REGISTERED`.
3. Collect manual details when needed.
4. Request geolocation permission.
5. Submit attendance to `POST /api/attendance/qr/:code/join`.
6. API checks distance against event radius before creating attendance.

## Production Checklist

- Use Node.js `>=20.19.0`.
- Set strong, different `JWT_SECRET` and `JWT_REFRESH_SECRET` values.
- Set `SWAGGER_ENABLED=false` if docs should not be public.
- Set production `NEXT_PUBLIC_API_URL`, `ATTENDANCE_APP_URL`, and `ADMIN_APP_URL`.
- Run `pnpm prisma:migrate` from `attendance-api` during deployment.
- Serve apps behind HTTPS so secure cookies are enabled.
