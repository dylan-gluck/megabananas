---
id: task-16
title: Add Scene entity type for background asset generation
status: To Do
assignee: []
created_date: '2026-01-05 05:29'
updated_date: '2026-01-05 06:11'
labels:
  - scene
  - entity
  - backend
  - frontend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a Scene entity type for organizing background assets within Projects. Scenes store metadata about artistic style and serve as parent containers for background-related asset types. This task leverages the shared utilities from task-17 refactor: lib/types/index.ts for types, lib/db/includes.ts for Prisma include patterns, and lib/api/response.ts for API helpers. Covers data model, UI integration (sidebar listing, project homepage grid), and CRUD routes—not asset generation workflows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scene model exists in Prisma schema with relations to Project and Asset (including primaryAsset)
- [ ] #2 scene added to AssetType enum in prisma/schema.prisma AND lib/types/index.ts
- [ ] #3 Scene CRUD API routes at /api/scenes and /api/scenes/[id] using shared response helpers (badRequest, jsonCreated, serverError, notFound)
- [ ] #4 sceneWithAsset and sceneWithDetails include patterns added to lib/db/includes.ts
- [ ] #5 Scene and SceneWithAsset types exported from lib/types/index.ts
- [ ] #6 projectWithRelations include updated to include scenes
- [ ] #7 ProjectWithRelations type updated to include scenes array
- [ ] #8 scene added to TabType union in lib/store.ts
- [ ] #9 ActionContext supports new-scene and edit-scene cases importing SceneWithAsset from lib/types
- [ ] #10 Scenes collapsible section in left-sidebar.tsx lists project scenes with New button
- [ ] #11 Scenes grid section on project-view.tsx displays SceneCard components
- [ ] #12 NewSceneForm allows creating scenes with name, description, artStyle, mood, timeOfDay, environment, styleNotes
- [ ] #13 EditSceneForm allows updating scene metadata and shows primaryAsset preview
- [ ] #14 scene-presets.ts config created following character-presets.ts pattern
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
### Step 1: Prisma Schema Updates
**File: prisma/schema.prisma**

1.1 Add `scene` to AssetType enum
1.2 Add Scene model with fields: id, projectId, name, description, createdAt, updatedAt, artStyle, mood, colorPalette, styleNotes, primaryAssetId
1.3 Add relations: project (Project), primaryAsset (Asset), assets (Asset[])
1.4 Update Project model - add scenes relation
1.5 Update Asset model - add sceneId field, scene relation, primaryForScene relation, and index

### Step 2: Central Types Updates
**File: lib/types/index.ts**

2.1 Add `"scene"` to AssetType union (line 10)
2.2 Add `Scene` to Prisma re-exports (line 2-7)
2.3 Add Scene import from Prisma client
2.4 Add SceneWithAsset interface extending Scene with primaryAsset: Asset | null

### Step 3: Prisma Includes Updates
**File: lib/db/includes.ts**

3.1 Add sceneWithAsset include pattern using `satisfies Prisma.SceneInclude`
3.2 Add sceneWithDetails include pattern (includes project relation)
3.3 Update projectWithRelations to include scenes with sceneWithAsset pattern

### Step 4: Store Updates
**File: lib/store.ts**

4.1 Import SceneWithAsset from "@/lib/types"
4.2 Add "scene" to TabType union (after "reference-assets")
4.3 Add ActionContext cases:
    - { type: "new-scene"; projectId: string }
    - { type: "edit-scene"; scene: SceneWithAsset }

### Step 5: API Routes
**File: app/api/scenes/route.ts (new)**
- Import: badRequest, jsonCreated, serverError from "@/lib/api/response"
- Import: sceneWithAsset from "@/lib/db/includes"
- POST handler: validate name/projectId, create with include pattern
- Follow app/api/characters/route.ts pattern exactly

**File: app/api/scenes/[id]/route.ts (new)**
- Import: jsonSuccess, notFound, serverError, badRequest from "@/lib/api/response"
- Import: sceneWithDetails from "@/lib/db/includes"
- GET: fetch with include, return jsonSuccess or notFound("Scene")
- PATCH: update fields, return jsonSuccess
- DELETE: delete scene, return jsonSuccess

### Step 6: Scene Presets Configuration
**File: lib/config/scene-presets.ts (new)**
- Follow lib/config/character-presets.ts pattern exactly
- Export presets: styles, moods, timeOfDay, environments
- Each preset: { id, label, promptFragment }
- Export buildSceneSystemPrompt(selections) function

### Step 7: UI Components
**File: components/ide/forms/new-scene-form.tsx (new)**
- Import presets from "@/lib/config/scene-presets"
- Form fields: name, description, artStyle (select), mood (select), timeOfDay (select), environment (select), styleNotes (textarea)
- POST to /api/scenes, refreshCurrentProject on success

**File: components/ide/forms/edit-scene-form.tsx (new)**
- Accept scene: SceneWithAsset prop
- Show primaryAsset preview if exists
- PATCH to /api/scenes/[id], refreshCurrentProject on success

**File: components/ide/right-sidebar.tsx**
- Import Mountain icon from lucide-react
- Import NewSceneForm and EditSceneForm
- Add "new-scene" case to ActionContextIcon, ActionContextTitle, ActionContextContent
- Add "edit-scene" case to ActionContextIcon, ActionContextTitle, ActionContextContent

**File: components/ide/left-sidebar.tsx**
- Import Mountain icon from lucide-react
- Add scenesOpen state (useState)
- Add handleSceneClick and handleNewScene handlers
- Add Scenes collapsible section after Characters section

**File: components/ide/views/project-view.tsx**
- Import Mountain icon from lucide-react
- Add Scenes grid section after Characters section
- Add SceneCard component following CharacterCard pattern

### Step 8: Database Migration
Run: bun run db:generate && bun run db:push

## Implementation Order
1. Prisma schema (Step 1)
2. Database commands (Step 8)
3. Central types (Step 2)
4. Prisma includes (Step 3)
5. Store updates (Step 4)
6. API routes (Step 5)
7. Scene presets (Step 6)
8. UI forms (Step 7 - new-scene-form, edit-scene-form)
9. Right sidebar wiring (Step 7)
10. Left sidebar section (Step 7)
11. Project view grid (Step 7)
12. End-to-end testing
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Key Pattern References (from task-17 refactor)

### API Routes Pattern
Reference: app/api/characters/route.ts
```typescript
import { badRequest, jsonCreated, serverError } from "@/lib/api/response";
import { characterWithPrimaryAsset } from "@/lib/db/includes";
```

### Types Pattern
Reference: lib/types/index.ts
- Re-export base types from Prisma
- Define AssetType as string union (not enum import)
- Extended types: `interface SceneWithAsset extends Scene { primaryAsset: Asset | null }`

### Includes Pattern
Reference: lib/db/includes.ts
```typescript
export const sceneWithAsset = {
  primaryAsset: true,
} satisfies Prisma.SceneInclude;
```

### Store Pattern
Reference: lib/store.ts
- Import types from "@/lib/types" (NOT define inline)
- ActionContext is a union type with { type: string; ... } discriminator

## Files to Create
- app/api/scenes/route.ts
- app/api/scenes/[id]/route.ts
- lib/config/scene-presets.ts
- components/ide/forms/new-scene-form.tsx
- components/ide/forms/edit-scene-form.tsx

## Files to Modify
- prisma/schema.prisma (add Scene model, update enums/relations)
- lib/types/index.ts (add Scene, SceneWithAsset, update AssetType)
- lib/db/includes.ts (add scene patterns, update projectWithRelations)
- lib/store.ts (add scene TabType, ActionContext cases)
- components/ide/left-sidebar.tsx (add Scenes section)
- components/ide/right-sidebar.tsx (wire up scene forms)
- components/ide/views/project-view.tsx (add Scenes grid)

## Dependencies
- Requires task-17 refactor to be complete (shared utilities in place)
- No runtime dependencies on other tasks
<!-- SECTION:NOTES:END -->
