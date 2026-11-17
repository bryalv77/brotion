# Notion Clone

A self-hosted clone of Notion, built with the **Spec-Driven Development**
pipeline (`spec.md → plan.md → tasks.md → implementation → verification gate`).
See [`specs/README.md`](./specs/README.md) and
[`specs/constitution.md`](./specs/constitution.md) for the workflow and the
non-negotiable rules.

## Deployed

- **Web:** https://notion-clone-web.pages.dev
- **API:** https://notion-clone-api.bryalv77.workers.dev (Cloudflare Workers + Neon)
- See [`docs/deployment.md`](./docs/deployment.md) for the full setup and credentials.

## Stack

- **App (web + iOS + Android):** one Expo project in `frontend/` — Expo Router,
  React Native, react-native-web, NativeWind (Tailwind for RN), TypeScript
- **Backend:** Hono (Node + Cloudflare Workers), TypeScript
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT in httpOnly cookies on web; on native, tokens are stored in the
  OS Keychain/Keystore (Expo SecureStore) and sent as bearer/refresh headers.
  Native clients opt in with `X-Client-Platform: native`, so the browser's
  httpOnly-cookie flow is unchanged.
- **E2E:** the original Playwright suite targets the archived Vite app
  (`frontend/legacy-web/`) and needs porting to the Expo web build.

## Prerequisites

| Tool | Why | Install |
|------|-----|---------|
| Node.js ≥ 20 | Runtime + tooling | https://nodejs.org or `brew install node` |
| Yarn 1.x | Package manager (constitution §2) | `corepack enable && corepack prepare yarn@1 --activate` |
| Docker runtime | Postgres container | **Colima** (no Docker Desktop): `brew install colima` then `colima start` |
| `docker compose` | Orchestrate Postgres | `brew install docker-compose` (registers the plugin for Colima) |
| Expo Go (optional) | Run the app on a physical device | Install Expo Go on iOS/Android, or use a simulator |

> No Docker Desktop. This repo assumes **Colima** as the Docker runtime; the
> `docker-compose.yml` works against it directly.

## Quick start (one command)

```bash
colima start          # start the Docker runtime (once per boot)
yarn db:up            # start Postgres via docker compose
yarn install          # install all workspaces
cp backend/.env.example backend/.env      # backend config (DATABASE_URL etc.)
cp frontend/.env.example frontend/.env    # EXPO_PUBLIC_API_URL (LAN IP for devices)
yarn migrate          # create/apply Prisma migrations
yarn seed             # seed the placeholder row
yarn dev              # Expo web :8082 + backend :4000, concurrently
```

Then open http://localhost:8082 and sign in (or register). To run the **same
codebase** natively:

```bash
yarn ios               # iOS simulator (needs Xcode)
yarn android           # Android emulator
yarn workspace frontend start   # Expo Go / dev server for a physical device
```

For a physical device, set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your
machine's LAN IP (e.g. `http://192.168.1.20:4000`) — `localhost` on a device
refers to the device itself.

> The backend's `/api/v1/health` endpoint is DB-free, so the stack boots even
> before Postgres is up. Only `yarn migrate` / `yarn seed` require Postgres.

## Scripts (run from the repo root)

| Script | What it does |
|--------|--------------|
| `yarn dev` | Start Expo web (:8082) + backend (tsx watch) concurrently |
| `yarn web` / `yarn ios` / `yarn android` | Start the Expo app on that platform |
| `yarn build` | Type-check + build all workspaces; `frontend` exports the static web build |
| `yarn start` | Run the built backend (`dist/server.js`) |
| `yarn migrate` | `prisma migrate dev` (create/apply migrations) |
| `yarn seed` | Run the Prisma seed script |
| `yarn lint` | ESLint across the whole workspace |
| `yarn typecheck` | `tsc --noEmit` across all workspaces |
| `yarn test:api` | 105 backend API E2E tests (archived suite, still valid) |
| `yarn test:e2e` | Expo web UI E2E tests (login, shell, editor, search, trash) |
| `yarn test:e2e:legacy` | Original Vite/TipTap UI suite (archived; will not pass) |
| `yarn db:up` / `yarn db:down` | Start / stop the Postgres container |

## Repository layout

```
notion-clone/
├── frontend/      Expo app: web + iOS + Android (Expo Router, RN, NativeWind)
│   ├── app/       file-based routes
│   ├── components/ native UI (shell, sidebar, databases, editor-adjacent)
│   ├── features/editor/ native block editor (replaces TipTap)
│   ├── hooks/     data hooks shared by all platforms
│   ├── lib/       API client, secure token storage, session store, query keys
│   ├── stores/    zustand UI/theme/toast stores
│   └── legacy-web/ archived Vite app + Playwright suite (reference only)
├── backend/       Hono + TS + Prisma (modules per domain)
├── shared/        API + block contracts (single source of truth for both apps)
├── docs/          architecture + ADRs
├── specs/         SDD specs (constitution, README, per-feature folders)
└── docker-compose.yml
```

## Spec-Driven Development

No code is written without an approved `spec.md` + `plan.md` for that unit of
work. Per-feature specs live under `specs/NNN-name/`. The current state:

- [`specs/000-architecture`](./specs/000-architecture) — ✅ architecture,
  DB schema, API contracts, editor decision
- [`specs/001-setup`](./specs/001-setup) — ✅ monorepo & environment (this task)

## Verification gate

Every task must pass clean before it's considered done (constitution §5):

```bash
yarn lint
yarn typecheck
yarn workspace frontend build:web   # ensures all three platforms' code bundles
yarn test:api                       # backend API E2E
yarn test:e2e                       # Expo web UI E2E
```

### E2E notes

Both suites reset + reseed the demo database in `globalSetup` and need the
backend reachable. If a local PostgreSQL is already using port 5432 (common on
macOS), remap the Docker container and point the tests at it:

```bash
POSTGRES_PORT=5433 docker compose up -d --force-recreate
export DATABASE_URL='postgresql://notion:notion@127.0.0.1:5433/notion_clone'
yarn test:api
yarn test:e2e
```

`yarn test:e2e` starts both servers itself and drives the Expo web build in
headless Chromium. The browser binary is installed with
`yarn workspace frontend playwright install chromium`.
