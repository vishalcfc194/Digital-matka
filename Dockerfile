# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci

COPY packages/types ./packages/types
COPY packages/backend ./packages/backend

# Build shared types + generate Prisma client (skip strict tsc app build; run via tsx)
RUN npm run build --workspace=packages/types \
  && npm run db:generate --workspace=packages/backend

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/package.json /app/package-lock.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/types ./packages/types
COPY --from=base /app/packages/backend ./packages/backend

WORKDIR /app/packages/backend
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && npx tsx src/app.ts"]
