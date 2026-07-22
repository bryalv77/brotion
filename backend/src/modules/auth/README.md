# Auth module (`/api/v1/auth`, `/api/v1/me`)

JWT access tokens (15m, stateless) + opaque refresh tokens (30d, server-tracked
in `sessions`, argon2-hashed). Both delivered in httpOnly cookies — no token
touches JavaScript.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | CSRF | Creates user + logs in (sets cookies). 409 on dup email. |
| POST | `/auth/login` | CSRF | Sets cookies. 401 on bad credentials (no enumeration). |
| POST | `/auth/logout` | CSRF | Revokes session, clears cookies. Idempotent. |
| POST | `/auth/refresh` | CSRF | Rotates refresh token + issues new access cookie. 401 if invalid/revoked. |
| GET | `/me` | required | Returns current user. |

## Security notes
- Passwords hashed with **argon2id** (OWASP baseline params).
- Refresh token **rotated on every refresh**; the old session row is revoked.
- Mutating routes require `X-Requested-With: XMLHttpRequest` (CSRF guard, on top
  of `SameSite=Lax` cookies).
- `UserDTO` (see `users.dto.ts`) is the only shape that ever leaves the module;
  `password_hash` never does.

## Demo user (from `prisma/seed.ts`)
`demo@notion.local` / `password123`
