# Notion Clone

A Notion clone: one Expo app for web, iOS and Android, a Hono API, and PostgreSQL.

- **Web:** https://notion-clone-web.pages.dev
- **API:** https://notion-clone-api.bryalv77.workers.dev (Cloudflare Workers + Neon)

## Stack

- **App:** Expo (Expo Router, React Native, react-native-web, NativeWind), TypeScript, in `frontend/`
- **Backend:** Hono on Node (local) and Cloudflare Workers (production), Prisma, in `backend/`
- **Shared:** API types, block schema and the formula engine, in `shared/`
- **Database:** PostgreSQL
- **Auth:** JWT in httpOnly cookies on web; on native, tokens live in SecureStore and are sent as bearer headers

## Run locally

Needs Node ≥ 20, pnpm 10+ and a local PostgreSQL.

```bash
createdb notion_clone
pnpm install
cp backend/.env.example backend/.env      # set DATABASE_URL and the JWT secrets
cp frontend/.env.example frontend/.env    # EXPO_PUBLIC_API_URL (LAN IP for physical devices)
pnpm migrate
pnpm seed
pnpm dev                                  # Expo web :8082 + backend :4000
```

`pnpm ios`, `pnpm android` and `pnpm --filter frontend start` run the same app natively.

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Expo web and the backend together |
| `pnpm migrate` / `pnpm seed` | Prisma migrations / demo data |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` across workspaces |
| `pnpm test:api` | API end-to-end tests (`frontend/tests/api`) |
| `pnpm test:e2e` | Expo web UI end-to-end tests |

Both test suites reset the demo database and need `DATABASE_URL` set:

```bash
export DATABASE_URL='postgresql://<user>@127.0.0.1:5432/notion_clone'
```

The browser for `test:e2e` is installed with `pnpm --filter frontend playwright install chromium`.

## Deploy

Authenticate with `neon login` and `npx wrangler login`, then:

```bash
export DATABASE_URL='<neon pooled connection string>'
pnpm --filter backend prisma:deploy

pnpm --filter backend exec wrangler secret put DATABASE_URL
pnpm --filter backend exec wrangler secret put JWT_ACCESS_SECRET
pnpm --filter backend exec wrangler secret put JWT_REFRESH_SECRET
pnpm --filter backend exec wrangler r2 bucket create notion-clone-files   # once
pnpm --filter backend exec wrangler deploy

pnpm --filter frontend build:web
npx wrangler pages deploy frontend/dist --project-name notion-clone-web
```

Set `CLIENT_ORIGIN` in `backend/wrangler.toml` to the Pages URL, and set `EXPO_PUBLIC_API_URL` to the Workers URL for web and native builds.
