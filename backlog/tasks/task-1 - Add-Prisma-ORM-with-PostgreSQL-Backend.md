---
id: task-1
title: Add Prisma ORM with PostgreSQL Backend
status: Done
assignee: []
created_date: '2026-01-02 00:17'
updated_date: '2026-01-02 00:57'
labels:
  - infrastructure
  - database
  - prisma
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Objective

Add Prisma ORM to enable database-backed persistence, replacing the current file-system-only storage pattern. This establishes the foundation for the new data model and entity relationships.

## Context

The application currently stores generated images as files in `public/assets/` with no database. A `DATABASE_URL` for local PostgreSQL already exists in `.env`. Prisma will provide type-safe database access, migrations, and schema management.

## Key Decisions

**PostgreSQL over alternatives**: Local Postgres instance provides relational integrity needed for Project → Character → Animation → Frame relationships. The existing DATABASE_URL confirms this choice.

**Prisma over alternatives**: Prisma offers excellent TypeScript integration, auto-generated client types, and migration tooling that fits the Next.js ecosystem already in use.

**Local-first development**: Using local Postgres rather than cloud/managed service for development simplicity. Production deployment decisions deferred.

## Requirements

### Installation
- Install `prisma` as dev dependency and `@prisma/client` as dependency using `bun`
- Follow official Prisma quickstart for initial setup

### Configuration
- Initialize Prisma with PostgreSQL provider
- Configure schema location and client output in `prisma/schema.prisma`
- Ensure `.env` DATABASE_URL is correctly referenced

### Schema Foundation
- Create initial schema with placeholder model to validate connection
- Generate Prisma client and verify TypeScript types are available

### Migration Workflow
- Set up initial migration to establish baseline
- Document migration commands for team reference

### Package Scripts
- Add `bun` scripts for common Prisma operations:
  - `db:migrate` - Run migrations in development
  - `db:push` - Push schema changes (dev/prototyping)
  - `db:pull` - Introspect existing database
  - `db:generate` - Regenerate Prisma client
  - `db:studio` - Launch Prisma Studio for data browsing

### Client Integration
- Create a shared Prisma client instance in `/lib/prisma.ts`
- Implement singleton pattern to prevent multiple client instances in development (Next.js hot reload consideration)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prisma packages installed via bun and project compiles without errors
- [ ] #2 prisma/schema.prisma exists with PostgreSQL provider configured
- [ ] #3 Prisma client generates successfully and TypeScript types are available in IDE
- [ ] #4 Can connect to local PostgreSQL and run initial migration
- [ ] #5 Package.json contains all specified db:* scripts
- [ ] #6 Prisma client singleton exists in /lib/prisma.ts
- [ ] #7 Running `bun run db:studio` opens Prisma Studio successfully
<!-- AC:END -->
