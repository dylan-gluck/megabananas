---
id: task-4.1
title: Fix Sequential Animation Generation Flow
status: Done
assignee: []
created_date: '2026-01-02 19:02'
labels: []
dependencies: []
parent_task_id: task-4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two critical gaps in sequential animation workflow:

1. NEW ANIMATION FORM: Must create animation AND kick off initial frame generation. Currently creates DB record only.

2. REFERENCE IMAGE LOGIC BUG: Current impl passes character + ALL prior frames to every Gemini request. Should be:
   - Frame 0: character image ONLY as reference
   - Frame 1+: ONLY previous frame as reference (no character, no cumulative frames)

This ensures visual consistency through sequential context propagation, not context overload.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New Animation form creates animation in DB and immediately starts frame generation (integrated flow)
- [ ] #2 First frame generation uses ONLY character asset as reference image
- [ ] #3 Subsequent frames use ONLY the previous generated frame as reference (not character, not all prior frames)
- [ ] #4 Generate-frames-form shows existing animation frames as selectable reference images
- [ ] #5 Clicking Add Frames pre-selects the last existing frame as reference
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update gen-animation/route.ts reference logic:
   - Frame 0: referenceImages = [characterImage]
   - Frame 1+: referenceImages = [generatedFrameImages[i-1]] (previous frame only)

2. Merge new-animation-form.tsx with generate-frames-form.tsx logic:
   - Add generation UI (progress grid, SSE handling) to new-animation form
   - On submit: create animation, then immediately call gen-animation API
   - Keep generate-frames-form.tsx for adding frames to existing animations

3. Enhance generate-frames-form.tsx reference picker:
   - Fetch animation.frames and display them as selectable references
   - Pre-select last frame when form opens

4. Update animation-prompts.ts if needed for better frame 0 vs continuation prompts
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Key files:
- app/api/gen-animation/route.ts (lines 153-157: bug location)
- components/ide/forms/new-animation-form.tsx
- components/ide/forms/generate-frames-form.tsx
- lib/config/animation-prompts.ts

Current bug (route.ts:153-157):
```
const referenceImages: ImageContent[] = [
  { mimeType: "image/png", data: characterImageBase64 },
  ...generatedFrameImages,
];
```

Should be:
```
const referenceImages: ImageContent[] = i === 0
  ? [{ mimeType: "image/png", data: characterImageBase64 }]
  : [generatedFrameImages[i - 1]];
```
<!-- SECTION:NOTES:END -->
