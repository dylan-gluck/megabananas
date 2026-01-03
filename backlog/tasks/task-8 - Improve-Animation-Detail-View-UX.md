---
id: task-8
title: Improve Animation Detail View UX
status: Done
assignee: []
created_date: '2026-01-02 19:45'
updated_date: '2026-01-02 19:49'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace Edit with Delete button, add Download Frames button, and integrate AssetThumbnail for frame display
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Edit button replaced with Delete button that removes animation from DB (files kept on disk)
- [ ] #2 Delete animation calls existing DELETE /api/animations/:id endpoint
- [ ] #3 Download Frames button downloads all frames via native browser download
- [ ] #4 Frame thumbnails use AssetThumbnail component instead of inline img/FrameCard
- [ ] #5 Clicking frame thumbnail opens asset detail view via openTab + setActionContext
- [ ] #6 Delete frame functionality retained via AssetThumbnail onDelete prop
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update header buttons: replace Edit→Delete, add Download Frames
2. Add deleteAnimation handler using fetch DELETE /api/animations/:id
3. Add downloadFrames handler using anchor element + download attribute
4. Replace FrameCard with AssetThumbnail, pass frame.asset, onDelete
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Files to modify:
- components/ide/views/animation-view.tsx

Key references:
- AssetThumbnail: components/ui/asset-thumbnail.tsx (accepts asset, onDelete props)
- Delete API: app/api/animations/[id]/route.ts DELETE handler exists
- FrameCard: local component at animation-view.tsx:624 (can be removed)
- Store: useAppStore provides openTab, setActionContext
<!-- SECTION:NOTES:END -->
