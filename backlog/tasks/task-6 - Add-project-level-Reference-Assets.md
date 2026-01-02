---
id: task-6
title: Add project-level Reference Assets
status: Done
assignee: []
created_date: '2026-01-02 16:12'
updated_date: '2026-01-02 17:00'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Reference assets type to projects for visual references during character generation. Reference assets are user-uploaded images used as style/visual guidance when creating new characters.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Asset model has type field to distinguish reference/character/frame assets
- [ ] #2 API endpoint for uploading reference assets to project
- [ ] #3 Project homepage shows References section with upload/delete UI
- [ ] #4 MultiSelectAssetPicker in forms filters to show only reference assets
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Schema: Add type enum to Asset (reference|character|frame)
2. API: POST /api/projects/[id]/references for upload
3. API: Update GET /api/projects/[id]/assets to accept ?type filter
4. UI: Add References section to project-view.tsx with grid + upload dropzone
5. UI: Update MultiSelectAssetPicker to filter type=reference
6. Migrate db and regenerate client
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files:
- prisma/schema.prisma (Asset model)
- app/api/projects/[id]/assets/route.ts
- components/ide/views/project-view.tsx
- components/ui/multi-select-asset-picker.tsx
- lib/store.ts (Asset type)

Existing Asset fields: id, projectId, filePath, systemPrompt, userPrompt, referenceAssetIds, generationSettings, characterId

File path convention for references: public/assets/[projectId]/references/[filename].png
<!-- SECTION:NOTES:END -->
