# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=22-slim
ARG NGINX_VERSION=1.25-alpine

FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable

WORKDIR /app

FROM base AS deps

ENV NODE_ENV=development
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/postcss.config.cjs apps/web/tailwind.config.ts ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile --filter @dashboard/web...

FROM deps AS build

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

COPY . .

RUN pnpm --filter @dashboard/web run build

FROM nginx:${NGINX_VERSION} AS runner

ENV NODE_ENV=production

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider --tries=1 http://127.0.0.1/healthz || exit 1

