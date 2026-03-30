# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PushSerbia API — a NestJS backend for the PushSerbia platform (connecting developers and projects in Serbia). Uses PostgreSQL via TypeORM, Firebase for authentication, and deploys on Vercel as a serverless function.

## Common Commands

```bash
npm run build              # Build to dist/
npm run start:dev          # Dev mode with watch
npm run start:prod         # Production mode
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
npm run test               # Unit tests (Jest)
npm run test:watch         # Tests in watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # End-to-end tests
npm run start:docker       # Start PostgreSQL via docker-compose
```

Run a single test file: `npx jest --config '{"moduleFileExtensions":["js","json","ts"],"rootDir":"src","testRegex":".*\\.spec\\.ts$","transform":{"^.+\\.(t|j)s$":"ts-jest"},"testEnvironment":"node"}' -- path/to/file.spec.ts`

Local PostgreSQL: `docker-compose up -d` starts Postgres 17 on port 5432 (postgres/postgres, db: pushserbia).

## Architecture

**Entry point**: `src/main.ts` bootstraps NestJS with global prefix `/v1`, validation pipe (whitelist + transform), cookie parser, security headers, CORS, custom exception filter, and ClassSerializerInterceptor.

**Module layout** (`src/app.module.ts`):
- `src/modules/auth/` — Firebase + LinkedIn OAuth. AuthMiddleware reads `__auth` cookie globally; ValidTokenOnlyMiddleware on `/users/me` and `/users/account`.
- `src/modules/users/` — User CRUD. Roles: participant, developer, admin.
- `src/modules/projects/` — Project CRUD with ban/soft-delete. Statuses: pending, voting, in progress, maintenance, closed, declined.
- `src/modules/votes/` — Weighted voting (weight = user.level). Transaction-based with unique constraint on (userId, projectId).
- `src/modules/unsplash/` — Proxy for Unsplash photo search API.
- `src/integrations/mailchimp/` — Email list subscription.

**Core infrastructure** (`src/core/`):
- `repository/repository.service.ts` — Abstract base service all module services extend. Provides CRUD + offset-based pagination.
- `filters/exceptions.filter.ts` — Global filter handling HttpException and TypeORM QueryFailedError (PostgreSQL error 23505 for unique violations).
- `config/` — Typed config registration (firebase, linkedin, mailchimp, auth).
- `decorators/` — `@GetUser()` extracts authenticated user from request.
- `utils/` — Gravatar hash generation, email normalization.

**Auth flow**: LinkedIn OAuth → Firebase custom token → `__auth` cookie → middleware verification on each request. Firebase custom claims store app_user_id, app_user_role, app_user_active.

**Authorization**: `@Roles([UserRole])` decorator + `RolesGuard` on controller methods.

**Data serialization**: class-transformer `@Exclude`/`@Expose` with serialization groups (e.g., `'me'` group exposes private fields only to the authenticated user).

## Database

PostgreSQL with TypeORM. Three entities: User, Project, Vote — all use UUID primary keys. `autoLoadEntities: true` in app module. Synchronize mode controlled by `TYPEORM_SYNCHRONIZE` env var. See `.env.example` for all required environment variables.

## Deployment

Vercel serverless via `vercel.json`. Entry point is `src/main.ts` built with `@vercel/node`. All HTTP methods route to the single function.

## Code Style

- ESLint flat config (`eslint.config.mjs`) with TypeScript and Prettier plugins
- Single quotes, trailing commas (Prettier)
- `@typescript-eslint/no-explicit-any` is off; `no-floating-promises` is warn
- Unit tests: `*.spec.ts` co-located with source files
- E2E tests: `test/*.e2e-spec.ts`
