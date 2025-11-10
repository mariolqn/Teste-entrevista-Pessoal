# 📊 Dynamic Dashboard Platform

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-4.25-black?logo=fastify)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-8.15-ffad00?logo=pnpm)](https://pnpm.io/)

</div>

## Overview

An enterprise-grade analytics and reporting platform built as a pnpm/Turborepo monorepo. The backend exposes dynamic charting, KPI, and option endpoints over Fastify + Prisma on MySQL; the frontend consumes the same shared TypeScript contracts through a Vite-powered React dashboard.

Seeded fixtures, cursor-based pagination, Redis-backed caching, and comprehensive validation make the solution production-ready out of the box while remaining easy to extend.

### Highlights

- **Dynamic chart engine** powered by a strategy pattern (`line`, `bar`, `pie`, `table`, `kpi`) with strict Zod input schemas, optional Redis caching, and problem+json errors.
- **Operational backend** featuring Prisma migrations/views, structured logging, graceful shutdown, rate limiting, security headers, and a generated OpenAPI contract.
- **Rich frontend experience** using TanStack Query, Recharts, Tailwind, Zustand, and accessibility-first UI primitives with infinite scroll selectors.
- **Developer tooling** including shared packages, Vitest unit + integration suites (Testcontainers), Docker Compose infrastructure, and GitHub Actions quality & security gates.

## Tech Stack

| Area | Stack | Notes |
| ---- | ----- | ----- |
| API | Node.js 20+, Fastify 4, Prisma 5, Zod, Pino, ioredis | Strategy-based chart services, cursor pagination, optional Redis cache |
| Data | MySQL 8, Prisma migrations & views, Decimal.js | Financial fact table with derived daily/category aggregates and seeded fixtures |
| Frontend | React 18, Vite 5, TypeScript strict, TanStack Query 5, Recharts 2, Zustand, Tailwind | Dashboard page, filters toolbar, summary cards, infinite scroll selects |
| Tooling | pnpm 8, Turborepo, Vitest, ESLint, Prettier, Testcontainers, Docker, GitHub Actions | Shared `@dashboard/types` + `@dashboard/shared` packages, SBOM + security scanning |

## Monorepo Layout

```
.
├── apps/
│   ├── api/                 # Fastify + Prisma backend
│   │   ├── src/
│   │   │   ├── config/      # Zod-based env parsing
│   │   │   ├── controllers/ # HTTP handlers delegating to services
│   │   │   ├── routes/      # Route registration + OpenAPI metadata
│   │   │   ├── services/    # Chart/dashboard/options services & strategies
│   │   │   ├── types/       # Request/response schemas
│   │   │   └── utils/       # Errors, cursor codec, logger, helpers
│   │   ├── prisma/          # Schema, migrations, seed data, SQL views
│   │   └── tests/           # Vitest unit + integration suites (Testcontainers)
│   └── web/                 # React dashboard
│       ├── src/
│       │   ├── components/  # Charts, dashboard panels, UI primitives
│       │   ├── hooks/       # Data fetching and utility hooks
│       │   ├── services/    # Typed API clients using shared contracts
│       │   ├── stores/      # Zustand store for filter state
│       │   └── providers/   # App-level providers (React Query, theme)
│       └── src/__tests__/   # Component/unit tests with @testing-library/vitest
├── packages/
│   ├── shared/              # Cross-app constants, formatters, utilities
│   └── types/               # Shared API + domain TypeScript definitions
├── docs/openapi.yaml        # Generated OpenAPI contract
├── docker-compose.yml       # Local stack (API, web, MySQL, Redis, tooling UIs)
├── scripts/init.sql         # MySQL bootstrap script for dockerised dev
└── .github/workflows/ci.yml # Quality & security pipeline
```

## Domain Model & Data Pipeline

| Table / View | Purpose | Notable Columns & Indexes |
| --- | --- | --- |
| `categories` | Cost centres for grouping metrics. | Indexed by `code`, `name`, `is_active`; full-text search over `name`/`description`. |
| `products` | Products/services mapped to categories. | Decimal `unit_price`, optional unique `code`; indexes on `category_id`, `name`, `unit_price`. |
| `customers` | Customers with geographic segmentation. | Unique `document`; indexes on `region`, `state`, `city`, `is_active`; full-text search on `name`. |
| `transactions` | Financial fact table powering charts/KPIs. | Tracks type, amount, quantity, occurred/due/paid dates; composite indexes for date+dimension filters. |
| `v_daily_summary` | View aggregating revenue/expense/profit per day. | Feeds line chart trends and KPI deltas. |
| `v_category_performance` | View of period/category performance metrics. | Powers top-N charts and table summaries. |

## Backend Architecture

```mermaid
graph TD
    A[React / API clients] -->|REST + problem+json| B[Fastify 4 Server]
    B --> C[Zod Validation & Schemas]
    C --> D[Controllers]
    D --> E[Services & Strategy Layer]
    E --> F[(Prisma ORM)]
    F --> G[(MySQL 8)]
    E --> H[(Redis Cache · optional)]
    B --> I[OpenAPI + Swagger UI]
    B --> J[Pino Structured Logger]
```

### Key Capabilities

- `ChartService` routes requests through dedicated strategies (`line`, `bar`, `pie`, `table`, `kpi`) with shared validation, top-N limits, and TTL-aware caching.
- `OptionsService` delivers cursor-based pagination with opaque base64 cursors, fuzzy search (`q`), filtering, and deterministic ordering.
- `DashboardService` computes revenue/expense/profit, overdue/upcoming accounts, and deltas using pre-aggregated views and windowed queries.
- Config is centrally parsed & validated via Zod with feature flags for caching, rate limiting, and Swagger; environment failures halt boot.

### Security & Reliability

- Helmet CSP, strict CORS, rate limiting (Redis-backed), structured logs with correlation IDs, graceful shutdown, and optional JWT secret support.
- Problem+json error envelopes, Prisma-specific error mapping, redaction of sensitive headers, and exhaustive schema validation.
- Health endpoints: `/api/v1/healthz`, `/livez`, `/readyz`, `/health` with dependency status for MySQL and Redis.

### Observability & Ops

- Pino logger with request/response serializers, response-time headers, and pretty printing in development.
- ETag-style caching via Redis `CacheService`, configurable TTLs per chart type, and helper to flush prefixes.
- OpenAPI spec generated via `pnpm --filter @dashboard/api swagger:generate`, served at `/api/docs` when enabled.

## Frontend Architecture

- Single-page dashboard built with React 18 + Vite 5, strict TypeScript, Tailwind CSS, and componentized layout (navigation, filters, charts, summary cards).
- Data fetching through TanStack Query with cache keys `['chart', type, start, end, metric, groupBy, dimension, topN]` ensuring automatic revalidation.
- Infinite-scroll selects using intersection observer + cursor pagination, resilient error boundaries, skeleton loaders, and accessible form controls.
- Zustand-backed store for filter state, `useChartData` hook for orchestrating API calls, and shared formatting via `@dashboard/shared`.

## Shared Packages

- `@dashboard/types`: canonical interfaces for chart responses, KPI summaries, and request shapes used by both API and web clients.
- `@dashboard/shared`: date/currency formatters, constants (`CHART_TYPES`, `METRICS`, `GROUP_BY`), pagination defaults, and validation helpers.

## Environment Configuration

### API (`.env` read at repo root)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | — | MySQL/PlanetScale connection string (`mysql://user:pass@host:3306/db`). |
| `PORT` | ➖ | `3000` | API port. |
| `API_HOST` | ➖ | `0.0.0.0` | Bind address. |
| `API_PREFIX` | ➖ | `/api/v1` | REST base path. |
| `CORS_ORIGIN` | ➖ | `http://localhost:5173` | Comma-separated list allowed; accepts array syntax. |
| `CORS_CREDENTIALS` | ➖ | `true` | Sets `Access-Control-Allow-Credentials`. |
| `DATABASE_POOL_MIN` | ➖ | `2` | Prisma connection pool minimum. |
| `DATABASE_POOL_MAX` | ➖ | `10` | Prisma pool maximum. |
| `REDIS_URL` | ➖ | `redis://localhost:6379` | Optional; disable caching with `FEATURE_CACHE_ENABLED=false`. |
| `FEATURE_CACHE_ENABLED` | ➖ | `true` | Toggle Redis cache usage. |
| `FEATURE_RATE_LIMIT_ENABLED` | ➖ | `true` | Toggle rate limiting middleware. |
| `FEATURE_SWAGGER_ENABLED` | ➖ | `true` | Generates/serves Swagger UI. |
| `LOG_LEVEL` | ➖ | `info` | Pino log level (`fatal`…`trace`). |
| `LOG_PRETTY` | ➖ | `true` | Pretty console output in development. |
| `JWT_SECRET` | optional | — | Provide for auth integrations (not required for demo). |

### Web (`apps/web/.env` or Vite env vars)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | API origin (no `/api/v1`). |
| `VITE_APP_ENV` | `development` | `development` \| `test` \| `production`; surfaces in runtime helpers. |

## Getting Started

1. **Install prerequisites**  
   Node.js ≥ 20, pnpm ≥ 8, Docker Desktop (Compose v2), and Git.
2. **Clone the repository**  
   ```bash
   git clone <your-fork-url> dashboard-platform
   cd dashboard-platform
   ```
3. **Install workspace dependencies**  
   ```bash
   pnpm install
   ```
4. **Bring up infrastructure**  
   ```bash
   pnpm run db:up           # mysql, redis, api, web, phpMyAdmin, redis-commander
   ```
5. **Apply migrations & seed fixtures**  
   ```bash
   pnpm run db:migrate
   pnpm run db:seed
   ```
6. **Start development servers**  
   ```bash
   pnpm run dev             # turbo runs api@3000 + web@5173
   ```
7. **Browse the app**  
   - Dashboard UI: http://localhost:5173  
   - API base: http://localhost:3000/api/v1  
   - Swagger UI: http://localhost:3000/api/docs (if enabled)

> Stop services with `pnpm run db:down`. Rebuild data with `pnpm run db:reset` (drops, migrates, seeds).

## Testing & Quality

| Command | Description |
| --- | --- |
| `pnpm test` | Run all configured test targets via Turborepo. |
| `pnpm test:unit` | Unit tests for API + web. |
| `pnpm test:integration` | API integration tests using Testcontainers (requires Docker). |
| `pnpm test:coverage` | Aggregated coverage reports (`apps/*/coverage`). |
| `pnpm lint` / `pnpm lint:fix` | ESLint with TypeScript, React, security, and unicorn rules. |
| `pnpm typecheck` | `tsc --noEmit` across packages. |
| `pnpm format:check` | Prettier verification; use `pnpm format` to apply. |

Integration tests automatically spin up a disposable MySQL 8 container, run Prisma migrations, and seed data — make sure Docker Desktop is running.

## API Surface

### Base URL

```
http://localhost:3000/api/v1
```

### Charts — `GET /charts/:type`

| Parameter | Values | Required | Notes |
| --- | --- | --- | --- |
| `type` (path) | `line`, `bar`, `pie`, `table`, `kpi` | ✅ | Selects strategy + response shape. |
| `start` | ISO date (`YYYY-MM-DD`) | ✅ | Inclusive start of period (max 365-day range). |
| `end` | ISO date (`YYYY-MM-DD`) | ✅ | Inclusive end of period. |
| `metric` | `revenue`, `expense`, `profit`, `quantity`, `count` | ➖ (`revenue`) | KPI to aggregate. |
| `groupBy` | `day`, `week`, `month`, `quarter`, `year`, `category`, `product`, `customer`, `region` | optional | Supported values depend on chart type. |
| `dimension` | e.g. `category`, `product`, `customer`, `region` | optional | Segment dimension for pie/bar charts. |
| `topN` | 1–100 | optional | Limits slices/bars; validated per chart type (`line` & `kpi` ignore). |
| `cursor` | base64 opaque | optional | Pagination cursor (table strategy). |
| `limit` | 1–100 (`20`) | optional | Page size for table strategy. |
| Filters | `categoryId`, `productId`, `customerId`, `region` | optional | Narrow dataset before aggregating. |

Responses mirror Recharts-friendly models (`series` with `points`, `categories`, `rows`, or KPI map) defined in `@dashboard/types`.

### Dashboard Summary — `GET /dashboard/summary`

Returns aggregated totals (`totalRevenue`, `totalExpense`, `liquidProfit`) plus overdue/upcoming accounts and metadata for the requested window. Supports optional filters `categoryId`, `productId`, `customerId`, `region`.

### Options — `GET /options/:entity`

| Parameter | Values | Required | Notes |
| --- | --- | --- | --- |
| `entity` (path) | `categories`, `products`, `customers`, `regions` | ✅ | Entity list to fetch. |
| `q` | string (1-100 chars) | optional | Fuzzy search term. |
| `limit` | 1–100 (`20`) | optional | Batch size. |
| `cursor` | base64 | optional | Opaque pagination cursor. |
| `includeInactive` | boolean | optional | Include inactive records. |
| `categoryId`, `region` | string | optional | Additional scoping per entity. |

Response: `{ items: [{ id, label, value, metadata? }], nextCursor?, hasMore, total }`.

### Health & Ops

- `GET /healthz` – lightweight health probe.
- `GET /livez` – liveness (always 200 if process responsive).
- `GET /readyz` – readiness (checks MySQL + Redis).
- `GET /health` – detailed stats (uptime, dependency latency, memory/cpu usage).

The full schema lives in `docs/openapi.yaml` and is served via Swagger UI for interactive exploration.

## Operations & Deployment

- **Production build**  
  ```bash
  pnpm run build          # builds web + api
  pnpm run build:api      # backend only
  pnpm run build:web      # frontend only
  pnpm start              # start built artifacts via Turbo
  ```
- **Docker Compose**  
  ```bash
  docker-compose up -d api web mysql redis
  ```
  Compose file also exposes phpMyAdmin (`http://localhost:8082`) and Redis Commander (`http://localhost:8081`) for inspection.

- **Docker images**  
  - Backend: `apps/api/Dockerfile` (multi-stage Node 22 build → distroless runtime).
  - Frontend: `apps/web/Dockerfile` (Vite build → Nginx serving static assets).

- **OpenAPI generation**  
  ```bash
  pnpm --filter @dashboard/api swagger:generate
  ```
  Updates `docs/openapi.yaml` using Fastify schemas.

## Runbook Snippets

| Task | Command |
| --- | --- |
| Reset database (drop, migrate, seed) | `pnpm run db:reset` |
| Apply iterative migration during dev | `pnpm --filter @dashboard/api prisma:migrate:dev --name <migration-name>` |
| Seed data only | `pnpm run db:seed` |
| Open Prisma Studio | `pnpm run db:studio` |
| Flush chart cache | Toggle `FEATURE_CACHE_ENABLED=false` or call Redis `FLUSHDB` via Redis Commander. |
| Update dependencies | `pnpm deps:update` (interactive) |
| Audit dependencies | `pnpm deps:check` / `pnpm audit --fix` |

## CI/CD

GitHub Actions workflow `.github/workflows/ci.yml` executes on PRs & `main`:

- Install dependencies with pnpm cache + Turbo remote cache.
- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck`.
- Run unit tests, integration tests (with Testcontainers), and coverage gates.
- Build both apps and regenerate OpenAPI spec (uploaded as artifact on `main`).
- Security job runs Gitleaks, generates SBOM via Anchore, and scans with Trivy (uploads SARIF).

## Troubleshooting

- **Testcontainers on macOS**: ensure Docker Desktop is running and virtualisation is enabled; set `DOCKER_HOST` if using Colima.
- **Port collisions**: adjust `PORT`/`VITE_API_URL`/Compose mappings if ports 3000, 5173, 3306, 6379, 8080, 8081, 8082 are occupied.
- **Redis optionality**: if Redis is unavailable, set `FEATURE_CACHE_ENABLED=false` to boot without caching.
- **Swagger in CI**: `FEATURE_SWAGGER_ENABLED` is auto-disabled in tests; set `SWAGGER_GENERATE=true` when generating docs headlessly.

## Contributing

1. Fork and create a feature branch (`git checkout -b feat/my-change`).
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add quarterly groupBy support`).
3. Ensure lint, typecheck, tests, and coverage pass: `pnpm ci`.
4. Open a Pull Request describing the change, tests, and validation steps.

## License

Licensed under the MIT License.
