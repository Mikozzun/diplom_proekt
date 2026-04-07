# syntax=docker/dockerfile:1

FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install deps + apply patches (postinstall runs patch-package + adminjs fix)
COPY package.json package-lock.json ./
COPY patches/ patches/
COPY scripts/ scripts/
RUN npm ci

COPY prisma/ prisma/
RUN npx prisma generate

# Copy app source + static assets
COPY src/ src/
COPY tsconfig.json ./
COPY public/ public/

ENV NODE_OPTIONS="--experimental-require-module"
EXPOSE 5000

CMD ["npx", "tsx", "src/index.ts"]
