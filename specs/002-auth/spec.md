# Spec: 002 — Authentication & users

## 1. Summary
Let a visitor register an account, log in, and stay logged in across requests via
httpOnly cookies holding a JWT access token (short-lived) plus a refresh token
(long-lived, server-tracked so it can be revoked). Provide `GET /me` to read the
current user and `/auth/logout` to end the session. All from `000-architecture`
contracts.

## 2. Motivation / user stories
- As a visitor, I want to register with email + password, so I can get an account.
- As a registered user, I want to log in, so subsequent requests recognize me.
- As a logged-in user, I want my session to persist and refresh automatically,
  so I don't get logged out every 15 minutes.
- As a logged-in user, I want to log out, so my session is invalidated everywhere.
- As a logged-in user, I want to fetch my own profile, so the UI can render it.
- As an attacker, I should NOT be able to read tokens from JS, forge a mutating
  request from another site, or read another user's data.

## 3. Scope
### In scope
- `User` and `Session` Prisma models (replacing the Task 1 placeholder).
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`,
  `POST /auth/refresh`, `GET /me`.
- Password hashing (argon2id).
- JWT access (15m) + refresh (30d, hashed in `sessions`).
- httpOnly/Secure/SameSite cookie issuance + clearing.
- `requireAuth` middleware + `GET /me`.
- Centralized error handling already exists (Task 1); wire auth errors to it.
- Input validation (zod) for all bodies.
- E2E tests covering register, login, refresh, logout, and protected-route denial.

### Out of scope
- Workspaces, pages, blocks (Task 3).
- Password reset / email verification / OAuth (not in the master prompt).
- Rate limiting / account lockout (noted as a future hardening item).

## 4. User-facing behavior
- **Register:** `POST /auth/register { email, password, name? }`. On success →
  201 + the new user is logged in (access + refresh cookies set). Duplicate email
  → 409. Bad input → 400. Passwords ≥ 8 chars.
- **Login:** `POST /auth/login { email, password }`. Valid → 200 + cookies set.
  Invalid credentials → 401 (same message whether email wrong or password wrong,
  to avoid user enumeration).
- **Me:** `GET /me` with a valid access cookie → 200 `{ user }`. No/invalid token
  → 401.
- **Refresh:** access token expired → client calls `POST /auth/refresh` with the
  refresh cookie → new access cookie issued, 200 `{ user }`. Invalid/expired/
  revoked refresh → 401, refresh cookie cleared.
- **Logout:** `POST /auth/logout` → revokes the session row, clears both cookies,
  204. Works even if already logged out.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`.
- Mutating endpoints require header `X-Requested-With: XMLHttpRequest` (CSRF
  guard on top of SameSite).

## 5. Dependencies
- Depends on spec(s): `000-architecture` (schema, contracts, security baseline),
  `001-setup` (Express app, env, error middleware, Prisma).
- Depended on by: `003-pages-and-blocks`+ (every mutating route uses
  `requireAuth` and the current user).

## 6. Acceptance criteria (must be testable 1:1 by e2e tests)
- [ ] `POST /auth/register` with valid input returns 201 + `{ data: { user } }`
      and sets two cookies.
- [ ] Duplicate email on register returns 409.
- [ ] `POST /auth/login` with valid credentials returns 200 + sets two cookies;
      the `user` payload excludes `password_hash`.
- [ ] `POST /auth/login` with wrong password returns 401.
- [ ] `GET /me` with a valid access cookie returns 200 + the user.
- [ ] `GET /me` with no cookie returns 401.
- [ ] `POST /auth/refresh` with a valid refresh cookie returns 200 + rotates the
      access cookie.
- [ ] `POST /auth/logout` returns 204 and clears cookies; subsequent `GET /me`
      returns 401.
- [ ] A mutating request without `X-Requested-With` is rejected (403).

## 7. Open questions
- Refresh-token rotation strategy: rotate on every refresh (stronger, detects
  reuse) vs. reuse until expiry (simpler). → plan: **rotate on every refresh and
  revoke the old session row**, the more secure default for a clone that may grow
  multi-device.
- Where do JWT secrets come from? → already in `config/env.ts` (optional in Task
  1); Task 2 makes them required and the app fails fast if missing in production.
