# Plan: 002 — Authentication & users

> Technical design derived from spec.md. Respects `specs/constitution.md` and
> `specs/000-architecture/plan.md` §2/§3 (User/Session schema, auth contracts,
> security baseline). Reuses Task 1's Express app, env, error middleware, Prisma.

## 1. Architecture overview

```
HTTP request
  → pino-http logger
  → express.json + cookieParser
  → cors (credentials: true)
  → routes:
       /api/v1/auth/*  → authRouter (public + csrfGuard on mutating)
       /api/v1/me      → meRouter   (requireAuth)
  → errorHandler (from Task 1)
```

New module: `backend/src/modules/auth/` with `auth.routes.ts`,
`auth.controller.ts`, `auth.service.ts`, `auth.schema.ts` (zod). Supporting code:
`backend/src/modules/users/` (`users.service.ts` + `users.dto.ts` to map
`User → UserDTO`), and `backend/src/security/` for hashing, JWT, cookies, csrf.

## 2. Data model

Replace the Task 1 placeholder with the real models from arch plan §2:

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password_hash String
  name          String?
  avatar_url    String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  sessions Session[]

  @@map("users")
}

model Session {
  id                 String   @id @default(cuid())
  user_id            String
  user               User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  refresh_token_hash String
  expires_at         DateTime
  created_at         DateTime @default(now())
  revoked_at         DateTime?

  @@index([user_id])
  @@index([refresh_token_hash])
  @@map("sessions")
}
```

Migration: `002_auth`. Seed: create a demo user (`demo@notion.local` /
`password123`) so the app is usable out of the box. **The placeholder
`HealthCheck` model is removed** in this migration.

## 3. API contracts

Exactly as in `shared/contracts.md` (auth section). Summary:

```
POST /auth/register  { email, password, name? }        → 201 { data: { user } } + cookies
POST /auth/login     { email, password }               → 200 { data: { user } } + cookies
POST /auth/logout    (no body)                          → 204, clears cookies
POST /auth/refresh   (no body; uses refresh cookie)     → 200 { data: { user } } + new access cookie
GET  /me             (uses access cookie)               → 200 { data: { user } }
```
Errors: 400 validation, 401 unauthenticated/bad credentials, 403 missing CSRF
header, 409 duplicate email. `UserDTO = { id, email, name, avatar_url }`.

Cookie names: `nc_access` (access JWT), `nc_refresh` (refresh token, opaque).
Refresh token is a random 32-byte URL-safe string; its **argon2 hash** is stored
in `sessions.refresh_token_hash`, never the raw token.

## 4. Frontend components
None this task (backend-only). The Task 1 hello-world `App.tsx` already calls
`/api/v1/health`; auth UI is a later task. The shared `request()` client already
sends `credentials: "include"` + `X-Requested-With`.

## 5. Libraries/tools chosen
| Concern | Choice | Why |
|--------|--------|-----|
| Hashing | **argon2** (`argon2` npm) | Constitution §6; winner of PHC, modern default |
| JWT | **jsonwebtoken** | De facto, small, typed via `@types/jsonwebtoken` |
| Random tokens | `node:crypto.randomUUID`/`randomBytes` → base64url | No extra dep |
| Validation | zod | Already in stack |
| Cookies | `cookie-parser` (already installed) | Already parsing cookies |

All within `constitution.md` §2/§6. **No deviation.**

## 6. Edge cases & error handling
- **Credential ambiguity:** login 401 message is `"Invalid email or password"`
  regardless of which is wrong (no enumeration).
- **Refresh rotation:** each `POST /auth/refresh` revokes the presented session
  row (`revoked_at = now`) and mints a new session + refresh cookie. If the
  presented refresh token's hash matches a session already revoked, treat as
  invalid (401, clear cookie) — handles token theft gracefully.
- **Expired/missing access + valid refresh:** client must call `/auth/refresh`
  itself; the server does not auto-refresh on `/me` (keeps `/me` cheap and
  side-effect-free).
- **Logout idempotent:** always 204 even with no/invalid refresh cookie.
- **Cookie security:** `Secure` only when `COOKIE_SECURE=true` (i.e. prod);
  `HttpOnly` always; `SameSite=Lax` always; `Path=/`.
- **Secrets in prod:** if `NODE_ENV=production` and a JWT secret is missing or
  <32 chars, boot fails fast (caught by `config/env.ts`).
- **CSRF:** mutating routes require `X-Requested-With: XMLHttpRequest`. The
  browser won't let a cross-origin form/fetch add custom headers without a
  preflight, which CORS denies → defense in depth with SameSite=Lax.

## 7. Non-functional considerations
- Access tokens are stateless (no DB lookup per request) → fast auth.
- argon2 params: `type: argon2id, memoryCost: 19456 (19 MiB), timeCost: 2,
  parallelism: 1` (OWASP-recommended baseline).
- `password_hash` never leaves the DB — `users.service.toDTO()` strips it.
- Sessions index on `refresh_token_hash` for O(log n) refresh lookup.

## 8. Deviations from constitution.md
None.

## 9. Resolution of spec open questions
- **Refresh rotation:** rotate on every refresh + revoke old row (spec §7).
- **Secrets:** `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` become required at boot
  in production (config/env.ts already declares them optional; this task adds a
  prod check in the security module before first sign).
