# syntax=docker/dockerfile:1

FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install deps + generate Prisma
COPY package.json package-lock.json ./
COPY patches/ patches/
RUN npm ci

# Fix AdminJS packages missing "require" condition in exports (Node 22 strict CJS + tsx)
RUN sed -i 's|"import": "./build/utils/styled.js",|"import": "./build/utils/styled.js",\n      "require": "./build/utils/styled.js",|' \
    node_modules/adminjs/node_modules/@adminjs/design-system/package.json && \
    sed -i 's|"import": "./lib/index.js",|"import": "./lib/index.js",\n      "require": "./lib/index.js",|' \
    node_modules/@adminjs/express/package.json && \
    sed -i 's|"import": "./lib/index.js",|"import": "./lib/index.js",\n      "require": "./lib/index.js",|' \
    node_modules/@adminjs/sql/package.json

COPY prisma/ prisma/
RUN npx prisma generate

# Copy app source + static assets
COPY src/ src/
COPY tsconfig.json ./
COPY public/ public/

ENV NODE_OPTIONS="--experimental-require-module"
EXPOSE 5000

CMD ["npx", "tsx", "src/index.ts"]
