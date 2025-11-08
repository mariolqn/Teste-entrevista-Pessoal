# Repository Guidelines

## 1. Principles

- **Security > Correctness > Performance > Features** (in that order under pressure).
    
- Prefer **immutability**, **pure functions**, and **explicitness**.
    
- Optimize for **maintainability**: clarity beats cleverness.
    

## 2. Languages & Frameworks

- **TypeScript first** for all JS/Node/React code (`"strict": true`).
    
- **Python** with modern typing; prefer `pydantic` for schemas/validation.
    
- Prefer **Postgres** (or MySQL when required). Use migrations (Prisma, Alembic, or Liquibase).
    
- Use Docker for dev/prod parity.
    

## 3. Project Layout (baseline)

```
/src
  /app | /server | /lib
  /components | /routes | /features
  /db (schema, migrations, seed)
  /config
  /tests (unit, integration, e2e)
scripts/
docs/
```

- Keep modules focused and small; avoid cross-layer imports (use interfaces).
    

## 4. Security Standards

- **Input validation everywhere**:
    
    - TS: Zod (or Valibot) for API boundaries.
        
    - Python: Pydantic models for requests/responses/config.
        
- **AuthN/AuthZ**: short-lived tokens, rotate refresh tokens, least privilege claims; explicit authorization checks at each protected use case.
    
- **Secrets**: only via env/secret manager; no `.env` committed; add `.env.example`.
    
- **Headers**: use Helmet (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).
    
- **Data**: parameterized queries; migrate with explicit up/down; encrypt sensitive fields at rest when required; redact PII in logs.
    
- **Rate limiting & abuse**: per-IP/user limits; bot protection where relevant.
    
- **Supply chain**: lockfiles, pin dependencies, Renovate/Dependabot, Gitleaks, SAST (CodeQL/Bandit), SBOM (Syft), image scan (Trivy).
    
- Map features to OWASP ASVS wherever feasible.
    

## 5. Performance Standards

- Measure before optimizing; add microbench marks where hot.
    
- DB: proper indexes, avoid N+1 (use JOINs/batching), read replicas when needed.
    
- Backend: async I/O, connection pooling, caching (HTTP, Redis), compression, ETags.
    
- Frontend: bundle budgets, code splitting, image optimization, memoization only when it helps, avoid unnecessary re-renders.
    
- Python: prefer vectorized libs, avoid global locks, use multiprocessing/asyncio thoughtfully.
    

## 6. Observability & Reliability

- Structured logs (JSON) with correlation IDs; redact secrets.
    
- Metrics (RED/USE): latency, errors, throughput; health/readiness endpoints.
    
- Tracing (OpenTelemetry).
    
- Retries with exponential backoff + jitter; idempotency for writes; circuit breakers on flaky deps.
    

## 7. API Design

- REST with consistent nouns; version under `/vX`; idempotent PUT, safe GET.
    
- Errors: consistent problem+json ({ `type`, `title`, `status`, `detail`, `instance` }).
    
- Pagination (cursor or page+limit); filtering/sorting; 429 on limits.
    
- **Contract first**: keep OpenAPI spec close to code; generate clients where possible.
    

## 8. React Standards

- Co-locate component, styles, tests.
    
- RSC/SSR when useful; suspense with proper fallbacks.
    
- Accessibility: labeled controls, keyboard nav, focus outlines, ARIA where necessary.
    
- State: prefer local state + server cache (e.g., React Query) over global stores; isolate heavy state.
    

## 9. Database & Data

- Migrations mandatory; never manual schema drift.
    
- Transactions for multi-step writes; outbox pattern for reliable events.
    
- Use UUIDv7 or ULIDs for keys; timestamps in UTC; store currency/quantities precisely (DECIMAL).
    
- Backfill scripts must be idempotent and restartable.
    

## 10. Testing Strategy

- **Unit**: fast, isolated (mocks/fakes).
    
- **Integration**: real DB/test containers; verify migrations & repos.
    
- **Contract**: provider/consumer (Pact).
    
- **E2E**: Playwright/Cypress for web; smoke on each deploy.
    
- **Quality gates**: overall **≥80%** coverage, critical paths **≥90%**; mutation testing on core logic when time allows.
    
- Property/fuzz tests for parsers/validators.
    

## 11. Tooling & Config

**JavaScript/TypeScript**

```json
// package.json (scripts excerpt)
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier -w .",
    "test": "vitest run --coverage"
  }
}
```

- ESLint (typescript-eslint), Prettier, Vitest/Jest, Playwright.
    
- `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.
    

**Python (pyproject.toml)**

```toml
[tool.black]
line-length = 100

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.mypy]
python_version = "3.11"
warn_unused_ignores = true
disallow_untyped_defs = true
strict = true
```

**.editorconfig**

```
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

## 12. CI/CD (GitHub Actions template)

- **On PR**: install deps + cache → typecheck → lint/format check → unit/integration tests → coverage gate → SAST → Gitleaks.
    
- **On main**: build artifacts/images (multi-stage Docker, non-root, distroless if possible) → SBOM + Trivy scan → push image → run e2e smoke on preview/prod → notify.
    

```yaml
name: ci
on: [pull_request, push]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm lint && pnpm test
      - run: pnpm -s coverage:check
      - uses: gitleaks/gitleaks-action@v2
      - uses: anchore/sbom-action@v0
      - uses: aquasecurity/trivy-action@0.24.0
        with: { scan-type: 'fs', severity: 'CRITICAL,HIGH' }
```

## 13. Containers (baseline)

- Multi-stage builds, prune dev deps, run as non-root, set `HEALTHCHECK`, minimal base (distroless/ubi-micro).
    
- Example (Node):
    

```dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN pnpm build

FROM gcr.io/distroless/nodejs22
WORKDIR /app
COPY --from=build /app/dist dist
ENV NODE_ENV=production
USER 10001
CMD ["dist/index.js"]
```

## 14. Documentation

- `README.md`: purpose, quickstart, env vars, run/test/build, architecture diagram, decisions.
    
- `docs/ADR-xxxx`: record key tradeoffs.
    
- Add OpenAPI/GraphQL schema docs and example requests.
    

## 15. Git & Releases

- **Conventional Commits**; squash-merge to main.
    
- Signed commits; CI blocks unsigned merges.
    
- Semantic versioning; auto-generate CHANGELOG on release.
    

## 16. Definition of Done (checklist)

-  Types complete & strict; no stray `any`.
    
-  Tests pass; coverage thresholds met.
    
-  Lint/format clean.
    
-  Security checklist passed (validation, headers, authz, secrets, scans).
    
-  Docs updated; runbook present.
    
-  CI green; images scanned; SBOM attached.
    

## 17. Agent Behavior (how you should “think”)

- Start by **restating requirements** and **listing assumptions**.
    
- If any critical info is missing, **state assumptions explicitly inside the plan** and proceed; design for easy refactor.
    
- Prefer boring, proven choices unless a strong justification exists.
    
- Produce **complete, runnable files**, not fragments.
    
- Include **tests and run scripts** by default.
    
- Call out **risks and mitigations** near the end.
    