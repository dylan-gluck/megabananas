---
id: task-11
title: 'Refactor: Nest animations and sprite sheets within characters'
status: To Do
assignee: []
created_date: '2026-01-05 03:18'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reorganize entity hierarchy so animations and sprite sheets display nested within characters rather than at project level. This is a UI/API cleanup - the data model already supports character-owned entities via characterId. No schema changes required.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ProjectWithRelations type no longer includes root-level animations/spriteSheets arrays
- [ ] #2 CharacterWithAssets type has required (non-optional) spriteSheets array
- [ ] #3 Project API returns animations/spriteSheets nested under characters, not at project root
- [ ] #4 Left sidebar no longer shows separate Animations and Sprite Sheets collapsible sections
- [ ] #5 Project view statistics calculate animation count from nested characters
- [ ] #6 Project view no longer displays separate Animations grid section
- [ ] #7 Creating animations/sprite sheets from character view and right sidebar quick actions still works
- [ ] #8 TypeScript compilation passes
- [ ] #9 Biome lint/format passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Phase 1: Schema Decision - No changes required. Keep projectId on Animation/SpriteSheet for efficient queries.

Phase 2: Update Store Types (lib/store.ts)
- Line 122-126: Remove animations and spriteSheets from ProjectWithRelations interface
- Lines 110-115: Change spriteSheets from optional to required in CharacterWithAssets

Phase 3: Update Project API (app/api/projects/[id]/route.ts)
- Lines 30-46: Remove root animations/spriteSheets includes
- Add animations and spriteSheets nested under characters include with proper ordering and relations

Phase 4: Update Left Sidebar (components/ide/left-sidebar.tsx)
- Remove state: animationsOpen, spriteSheetsOpen (lines 81-83)
- Remove handlers: handleAnimationClick, handleNewAnimation, handleSpriteSheetClick, handleNewSpriteSheet
- Remove Animations collapsible section (lines 480-538)
- Remove Sprite Sheets collapsible section (lines 540-595)
- Update imports: remove Film, Layers, AnimationWithFrames, SpriteSheetWithAsset

Phase 5: Update Project View (components/ide/views/project-view.tsx)
- Line 174: Update animation count to use reduce over nested characters
- Remove entire Animations section (lines 349-410)
- Remove AnimationCard component (lines 519-625)
- Update imports: remove Film, AnimationWithFrames
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Critical files:
- lib/store.ts - Core types
- app/api/projects/[id]/route.ts - API changes
- components/ide/left-sidebar.tsx - Remove sections
- components/ide/views/project-view.tsx - Remove animations grid
- components/ide/views/character-view.tsx - Reference only, no changes needed

Risk: Low - No schema migration, only UI/API changes

Rollback: Revert store types, API includes, and UI changes. Database unchanged.
<!-- SECTION:NOTES:END -->
