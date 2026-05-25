FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Dummy values so env.ts module-level validation passes at build time.
# Real values are injected at runtime via docker-compose environment.
ARG JWT_SECRET=build_placeholder
ARG DATABASE_URL=postgresql://build:build@localhost/build
ARG RESEND_API_KEY=build_placeholder
ARG FROM_EMAIL=build@placeholder.com
ARG APP_URL=http://localhost:3000
ARG ORIGIN=http://localhost:3000

RUN bun run build

FROM oven/bun:1
WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY entrypoint.sh ./
RUN sed -i 's/\r//' entrypoint.sh && bun install --frozen-lockfile && chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
