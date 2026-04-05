# Frogger Backend — Frontend Integration Guide

Complete documentation for connecting a frontend application to the Frogger backend API.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Getting Started](./01-getting-started.md) | Project overview, prerequisites, and quick start |
| [Authentication](./02-authentication.md) | Better Auth integration, social login, sessions, JWT |
| [API Reference](./03-api-reference.md) | Full REST API endpoint reference with examples |
| [Database](./04-database.md) | Schema overview, Prisma setup, direct DB access |
| [Environment & Deployment](./05-environment-deployment.md) | Environment variables, CORS, Fly.io deployment |

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌──────────────────────────────────┐
│  Frontend App   │ ◄────────────► │  Frogger Backend (Express)       │
│  (React, Next,  │                │                                  │
│   Vue, etc.)    │                │  /api/auth/*   → Better Auth     │
│                 │                │  /api/posts    → Posts CRUD       │
│  Better Auth    │  Cookies /     │  /api/users    → User profiles   │
│  Client SDK     │  Bearer JWT    │  /api/comments → Comments         │
│                 │                │  /api/...      → Other endpoints  │
└─────────────────┘                │                                  │
                                   │  PostgreSQL (Supabase)           │
                                   │  Prisma ORM                      │
                                   └──────────────────────────────────┘
```

## Quick Links

- **Production URL**: `https://frogger-backend.fly.dev`
- **Auth UI**: `https://frogger-backend.fly.dev/auth`
- **Health Check**: `https://frogger-backend.fly.dev/health`
- **Admin Panel**: `https://frogger-backend.fly.dev/admin`
- **API Base**: `https://frogger-backend.fly.dev/api`
