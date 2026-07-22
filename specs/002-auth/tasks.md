# Tasks: 002 — Authentication & users

> Derived from plan.md. Each task small and independently verifiable.

## Implementation
- [x] 1. Security layer: `security/password.ts` (argon2id hash/verify),
      `security/jwt.ts` (sign/verify access token, subject = user id),
      `security/tokens.ts` (random refresh token + argon2 hash),
      `security/cookies.ts` (build/clear cookie options from env).
- [x] 2. Env: JWT secrets required in production (fail-fast in `security/jwt.ts`).
- [x] 3. Prisma: `User` + `Session` models; migration `20260722010000_auth`;
      `seed.ts` now creates demo user `demo@notion.local / password123`.
- [x] 4. Users service: `users.service.ts` + `users.dto.ts` (`toUserDTO` strips
      `password_hash`).
- [x] 5. Auth service: `register`, `login`, `refresh` (with rotation), `logout`,
      `getCurrentUser`, `issueSession`.
- [x] 6. Auth schemas: zod `registerSchema` (password ≥8), `loginSchema`.
- [x] 7. CSRF guard `csrfGuard` (rejects mutating requests without
      `X-Requested-With`).
- [x] 8. `requireAuth` middleware: verify access cookie → load user → `req.user`.
- [x] 9. Routes: `auth.routes.ts` + `me.routes.ts`; mounted under `/api/v1`.
- [x] 10. Express `Request.user` augmentation in `src/types/express.d.ts`.

## Tests
- [x] Playwright API e2e covering every acceptance criterion (13 tests total,
      12 auth + 1 smoke): register 201, dup 409, short pw 400, login ok 200,
      login bad 401, unknown email 401, me ok 200, me no-cookie 401, refresh
      200, refresh-after-logout 401, logout 204→me 401, missing-CSRF 403.

## Verification gate
- [x] `yarn lint` — clean (0 errors, 0 warnings)
- [x] `yarn typecheck` — clean (frontend + backend + shared)
- [x] `yarn test:e2e` — 13 passed

## Docs
- [x] `specs/002-auth/` spec/plan/tasks present.
- [x] `backend/src/modules/auth/README.md` module note.
- [x] Contracts unchanged in `/shared/contracts.md`.

## Notes / deviations found during implementation
- **Express 4 async crash (root cause of all 12 initial test failures):** a
  thrown `ZodError` from `registerSchema.parse()` inside an async handler was
  NOT auto-forwarded to the error middleware by Express 4 — it crashed the whole
  process, which then made every subsequent request fail with Vite proxy
  ECONNREFUSED. Fixed by adding `utils/asyncHandler.ts` (wraps handlers so
  rejected promises / sync throws reach `next(err)`) and wrapping all auth/me
  handlers. **This pattern is now the project standard for all async handlers.**
- **jsonwebtoken types:** `@types/jsonwebtoken@9.0.10` types `expiresIn` as
  `ms.StringValue` (a branded type), not `string`. Cast the env TTL via
  `as StringValue` from the `ms` type.
- **pino-http default export:** shipped `.d.ts` declares a callable default but
  the runtime is CJS; under NodeNext the synthetic default is the namespace.
  Resolved with an explicit typed cast off `.pinoHttp` (carried from Task 1).
- **Prisma migrate interactive prompt:** `migrate dev` blocks in non-interactive
  shells on the "drop non-empty HealthCheck table" warning. Authored the
  migration SQL by hand and applied via `migrate deploy` instead.
- **Playwright webServer race:** API tests 500'd through the Vite proxy when the
  readiness gate only checked Vite (backend boots slower). Config now starts
  backend + frontend as two webServers, gating on the backend health endpoint.
