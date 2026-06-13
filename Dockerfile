FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY workers/package.json ./workers/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY packages/rsy/package.json ./packages/rsy/
COPY packages/seo/package.json ./packages/seo/
COPY packages/yandex/package.json ./packages/yandex/
COPY packages/queue/package.json ./packages/queue/
COPY packages/trends/package.json ./packages/trends/
COPY packages/automation/package.json ./packages/automation/

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="file:/tmp/build.db"
RUN npm run db:generate
RUN npm run build --workspace=apps/web
RUN npm run build --workspace=apps/admin

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p /app/packages/db/prisma /data

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 3000 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
