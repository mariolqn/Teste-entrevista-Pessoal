# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

FROM base AS deps

ENV NODE_ENV=development
ENV HUSKY=0

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential pkg-config openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsconfig.eslint.json apps/api/vitest.config.ts ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile --filter @dashboard/api... --prod=false

FROM deps AS build

WORKDIR /app

COPY . .

RUN pnpm --filter @dashboard/api prisma:generate
RUN pnpm --filter @dashboard/api run build

FROM build AS prod-deps
RUN pnpm deploy --filter @dashboard/api --prod /app/.output

FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies with Prisma client
COPY --from=prod-deps /app/.output/ ./

# Copy generated Prisma client from build stage (where it was successfully generated)
COPY --from=build /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma ./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma

# Copy application dist and other files
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/docs ./docs

USER 10001

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["/nodejs/bin/node", "-e", "const http=require('node:http');const port=process.env.PORT||3000;const req=http.request({host:'127.0.0.1',port,path:'/api/v1/healthz',timeout:3000},res=>{res.resume();if(res.statusCode!==200){process.exit(1);}});req.on('error',()=>process.exit(1));req.end();"]

CMD ["dist/src/index.js"]

