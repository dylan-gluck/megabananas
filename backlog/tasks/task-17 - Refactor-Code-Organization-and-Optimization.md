---
id: task-17
title: 'Refactor: Code Organization and Optimization'
status: To Do
assignee: []
created_date: '2026-01-05 05:34'
labels:
  - refactor
  - types
  - api
  - code-quality
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Analyze and improve code organization without changing business logic or functionality. Focus on consolidating duplicate types, extracting shared utilities, and establishing consistent API patterns across the codebase.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Central types module (lib/types/index.ts) exports Prisma types and extended relation types
- [ ] #2 API types module (lib/types/api.ts) contains SSE event types and request/response definitions
- [ ] #3 Store (lib/store.ts) imports from central types instead of defining duplicates
- [ ] #4 File utilities module (lib/file-utils.ts) consolidates scattered file operations
- [ ] #5 API response helpers (lib/api/response.ts) provide consistent error/success responses
- [ ] #6 Prisma includes module (lib/db/includes.ts) defines reusable include patterns
- [ ] #7 All API routes use shared response helpers and include patterns
- [ ] #8 bun run typecheck passes with no errors
- [ ] #9 bun run lint passes with no errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
### Phase 1: Types Consolidation

#### Step 1.1: Create Central Types Module
**File: `lib/types/index.ts` (new)**

Re-export Prisma-generated types and define extended types with relations:
```typescript
// Re-export base types from Prisma generated client
export type {
  Project, Asset, Character, Animation, Frame, SpriteSheet,
} from "@/lib/generated/prisma/client";

// Re-export enums
export { AssetType } from "@/lib/generated/prisma/client";

// Extended types with relations
export interface FrameWithAsset extends Frame { asset: Asset; }
export interface AnimationWithFrames extends Animation { character: Character; frames: FrameWithAsset[]; }
export interface SpriteSheetWithAsset extends SpriteSheet { asset: Asset; character: Character; }
export interface CharacterWithAssets extends Character {
  primaryAsset: Asset | null;
  assets: Asset[];
  animations: AnimationWithFrames[];
  spriteSheets: SpriteSheetWithAsset[];
}
export interface ProjectWithRelations extends Project { characters: CharacterWithAssets[]; }
export interface AnimationWithCharacterAsset extends AnimationWithFrames {
  character: Character & { primaryAsset: Asset | null; assets: Asset[] };
}
```

#### Step 1.2: Create API Types Module
**File: `lib/types/api.ts` (new)**

SSE event types, request/response types for generation endpoints:
- `SSEEvent` (currently inline in gen-animation/route.ts:22-28)
- `GenerateAnimationRequest` (currently inline lines 8-20)
- `GenerateCharacterRequest`, `GenerateSpritesheetRequest`
- `CreateCharacterRequest`, `CreateAnimationRequest`, `CreateAssetRequest`
- `ApiError` response type

#### Step 1.3: Update Store to Use Central Types
**File: `lib/store.ts`**
Remove duplicate types (lines 20-130), import from new types module. Keep only UI-specific types (Tab, TabType, ActionContext).

---

### Phase 2: File Utilities Consolidation

#### Step 2.1: Create File Utils Module
**File: `lib/file-utils.ts` (new)**

Consolidate scattered file operations:
- `ensureDirectoryExists` (from gen-animation/route.ts:36-40)
- `loadImageAsBase64` (from gen-animation/route.ts:30-34)
- `sanitizeFilename` (from gen-animation/route.ts:42-47)
- `saveBase64Image` (improved version of gemini.ts saveImageToFile)
- `generateTimestampedFilename`

#### Step 2.2: Update gemini.ts
Remove `saveImageToFile` (lines 99-118), routes should use new `saveBase64Image`.

#### Step 2.3: Update gen-animation/route.ts
Replace inline utilities (lines 30-47) with imports from `lib/file-utils.ts`.

---

### Phase 3: API Response Helpers

#### Step 3.1: Create API Response Utilities
**File: `lib/api/response.ts` (new)**

```typescript
export function jsonSuccess<T>(data: T, status = 200)
export function jsonCreated<T>(data: T)
export function jsonError(message: string, status = 500)
export function badRequest(message: string)
export function notFound(entity: string)
export function serverError(error: unknown, context: string)
```

#### Step 3.2: Update API Routes
Apply response helpers to all routes in `app/api/`:
- characters/route.ts, characters/[id]/route.ts
- projects/route.ts, projects/[id]/route.ts
- animations/route.ts, animations/[id]/route.ts
- assets/route.ts, assets/[id]/route.ts
- gen-animation, gen-character, gen-spritesheet routes

---

### Phase 4: Prisma Include Patterns

#### Step 4.1: Create Prisma Includes Module
**File: `lib/db/includes.ts` (new)**

Reusable include patterns:
- `frameWithAsset`
- `animationWithFrames`
- `spriteSheetWithAsset`
- `characterWithAssets`
- `projectWithRelations`
- `animationWithCharacterAssets`

#### Step 4.2: Update Routes to Use Shared Includes
Primary targets:
- `app/api/projects/[id]/route.ts` - has large inline include (lines 11-38)
- `app/api/characters/[id]/route.ts` - repeated include pattern

---

### Phase 5: API Client (Optional/Future)

#### Step 5.1: Create Typed API Client
**File: `lib/api/client.ts` (new)**
Lower priority but cleans up frontend code significantly. Provides typed methods for all API operations.

---

## Implementation Order

1. **Phase 1** (types) - Foundation, unblocks everything
2. **Phase 4.1** (prisma includes) - Small, high impact
3. **Phase 3.1** (response helpers) - Small, high impact
4. **Phase 2.1** (file utils) - Medium effort
5. **Incrementally update routes** using phases 2-4
6. **Phase 5** (API client) - Optional, lower priority
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Key Files Affected

| File | Changes |
|------|---------|
| `lib/store.ts` | Remove duplicate types (lines 20-130), import from types module |
| `lib/generated/prisma/client.ts` | Source of truth for Prisma types |
| `app/api/projects/[id]/route.ts` | Repeated include patterns to refactor |
| `app/api/gen-animation/route.ts` | Inline utilities and types to extract |
| All routes in `app/api/` | Apply response helpers |

## Testing Checklist
- `bun run typecheck` after each phase
- `bun run lint` for code style
- Manual test: create character, animation, spritesheet flows
- Verify project loading works

## Files to Create
- lib/types/index.ts
- lib/types/api.ts
- lib/file-utils.ts
- lib/api/response.ts
- lib/db/includes.ts
- lib/api/client.ts (optional/future)
<!-- SECTION:NOTES:END -->
