---
id: task-7
title: >-
  Create reusable AssetThumbnail component with context menu and asset detail
  view
status: Done
assignee: []
created_date: '2026-01-02 16:25'
updated_date: '2026-01-02 17:18'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a reusable AssetThumbnail UI component that displays asset images with hover context menu and click-to-open detail view in the workspace.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AssetThumbnail component renders asset image with aspect ratio
- [ ] #2 Hover shows context menu with Edit, Delete, View actions
- [ ] #3 Clicking asset opens new tab with type 'asset' showing large image
- [ ] #4 Asset detail view shows full image in center, metadata in right sidebar
- [ ] #5 Replaces existing AssetCard in character-view.tsx
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add "asset" to TabType union in lib/store.ts
2. Add view-asset ActionContext type for right sidebar metadata display
3. Create components/ui/asset-thumbnail.tsx with:
   - Props: asset, isPrimary?, onSetPrimary?, onDelete?, className
   - ContextMenu with View/Edit/Delete actions
   - Click handler to openTab("asset", assetId, filename)
4. Create components/ide/views/asset-view.tsx:
   - Fetch asset by ID, display full-size image centered
   - On mount, setActionContext({ type: "view-asset", asset })
5. Create components/ide/forms/asset-metadata-panel.tsx:
   - Display systemPrompt, userPrompt, createdAt, generationSettings, referenceAssetIds
6. Update workspace.tsx to handle "asset" tab type
7. Update right-sidebar.tsx to handle "view-asset" context
8. Replace AssetCard usage in character-view.tsx with AssetThumbnail
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Key files:
- lib/store.ts (TabType, ActionContext, Asset interface)
- components/ide/views/character-view.tsx (current AssetCard at line 379)
- components/ide/workspace.tsx (tab rendering)
- components/ide/right-sidebar.tsx (action context forms)
- components/ui/context-menu.tsx (shadcn context menu available)

Asset fields for metadata: systemPrompt, userPrompt, referenceAssetIds, generationSettings, createdAt
<!-- SECTION:NOTES:END -->
