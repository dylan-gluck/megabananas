# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev              # Start dev server
bun run build        # Production build
bun run lint         # Biome lint
bun run format       # Biome format
bun run check        # Biome lint+format with auto-fix
bun run typecheck    # TypeScript check

# Database (Prisma + PostgreSQL)
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema to database
bun run db:migrate   # Run migrations
bun run db:studio    # Open Prisma Studio
```

## Architecture

IDE-style app for AI character/animation generation using Gemini image models.

### Layout
Three-column layout: left sidebar (project nav) → tabbed workspace → right sidebar (action forms)

### Data Model
```
Project → Character → Animation → Frame
            ↓            ↓          ↓
         Asset ←─────────────────────
```

`Asset` is unified storage for all images with provenance tracking (systemPrompt, userPrompt, referenceAssetIds, generationSettings).

### Key Files
- `lib/store.ts` — Zustand state (tabs, sidebars, action context, current project)
- `lib/gemini.ts` — Gemini API helpers (generateImage, editImage)
- `lib/config/character-presets.ts` — Style/angle/background presets with prompt fragments
- `components/ide/` — IDE shell components (app-layout, left-sidebar, right-sidebar, workspace, views/, forms/)

### API Routes
Located in `app/api/`:
- `projects/`, `characters/`, `animations/`, `frames/`, `assets/` — CRUD
- `gen-character/`, `gen-sprite/`, `edit-character/` — Gemini generation endpoints

### File Path Conventions
- Characters: `public/assets/[projectId]/characters/[name]_[assetId].png`
- Frames: `public/assets/[projectId]/frames/[animationName]/[charName]_[animName]_[frameIdx].png`

## Code Style

- Biome for linting/formatting (2 spaces, double quotes, semicolons)
- Path alias: `@/*` maps to root
- shadcn/ui components in `components/ui/`
