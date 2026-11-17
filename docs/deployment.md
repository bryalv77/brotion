# Deployment: Cloudflare + Neon

## Live deployment

| Piece | URL / resource |
|---|---|
| Web app | https://notion-clone-web.pages.dev |
| API (Workers) | https://notion-clone-api.bryalv77.workers.dev |
| Database | Neon project `notion-clone` (`lucky-dream-66957744`, aws-us-east-2) |
| Uploads | R2 bucket `notion-clone-files` |
| Demo login | `demo@notion.local` / `password123` |

Important deployment-specific details:

- **No runtime WASM**: Cloudflare Workers forbids `WebAssembly.compile()` at
  request time, so password/refresh-token hashing uses WebCrypto (PBKDF2 /
  SHA-256) instead of argon2/hash-wasm. Existing local hashes are incompatible;
  Neon was reset + reseeded after the switch.
- **Per-request Neon client**: Workers forbid reusing I/O objects across
  requests, so `src/workers/index.ts` creates a fresh Neon pool + Prisma client
  for each request and scopes it with `AsyncLocalStorage`. The Neon HTTP
  adapter was rejected because Prisma 5.22 mis-decoded timestamps with it.
- **Cross-site cookies**: Workers sets `SameSite=None; Secure` so Pages →
  Workers fetch requests carry the session cookie.
- **Deep links**: Expo Router dynamic-route HTML is copied to extensionless
  `.htm` shells under `/_shells` (Cloudflare strips `.html` and encodes brackets
  in redirect targets). `_redirects` points there; `_headers` sets the content
  type.

One codebase, three targets:

| Piece | Platform | Cost |
|---|---|---|
| Expo web static export | Cloudflare Pages | Free |
| Backend API (Hono) | Cloudflare Workers | Free |
| PostgreSQL | Neon | Free tier |

## 1. Authenticate

```bash
neon login
npx wrangler login
```

`wrangler` is installed as a backend dev dependency, so use
`yarn workspace backend exec wrangler ...` from the repo root, or `npx wrangler`
(you may be prompted to install it once).

## 2. Neon database

```bash
# Create a project (pick a name and region when prompted)
neon projects create --name notion-clone --region us-east-1

# Get the pooled connection string for the default branch
neon connection-string --pooled

# Persist it locally for migrations (not committed)
export DATABASE_URL='postgresql://...'
yarn workspace backend prisma:deploy
```

Use the **pooled** connection string for Workers. Keep the direct string for
local `prisma migrate dev`.

Seed the demo user (optional): `yarn seed`.

## 3. Cloudflare Workers backend

From `backend/`:

```bash
# Secrets — never committed
yarn workspace backend exec wrangler secret put DATABASE_URL
yarn workspace backend exec wrangler secret put JWT_ACCESS_SECRET
yarn workspace backend exec wrangler secret put JWT_REFRESH_SECRET

# Create the R2 bucket used for uploads (once)
yarn workspace backend exec wrangler r2 bucket create notion-clone-files

# Validate the bundle locally without deploying
yarn workspace backend build:worker

# Deploy
yarn workspace backend exec wrangler deploy
```

`wrangler.toml` sets `CLIENT_ORIGIN` and `COOKIE_SECURE=true`. After deploying,
update `CLIENT_ORIGIN` in `wrangler.toml` to the real Pages URL and redeploy.

## 4. Cloudflare Pages frontend

```bash
# Build the static export
yarn workspace frontend build:web

# Deploy it (first run creates the project)
npx wrangler pages deploy frontend/dist --project-name notion-clone-web
```

`frontend/public/_redirects` is copied into `dist` and rewrites deep links such
as `/page/<id>` to Expo Router's pre-rendered dynamic-route shell.

## 5. Wire them together

Set these in the Pages project (Settings → Environment variables), then rebuild:

```
EXPO_PUBLIC_API_URL=https://notion-clone-api.<your-subdomain>.workers.dev
```

Native clients use the same variable via `frontend/.env` — point it at the
Workers URL.

## Local verification before deploying

```bash
yarn typecheck
yarn workspace frontend build:web
yarn workspace backend build:worker   # esbuild bundle check, no upload
yarn test:api
yarn test:e2e
```
