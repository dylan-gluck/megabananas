---
id: task-4
title: Implement Sequential Frame Animation Workflow
status: In Progress
assignee: []
created_date: '2026-01-02 00:18'
updated_date: '2026-01-02 18:40'
labels:
  - animation
  - api
  - ai-generation
  - workflow
dependencies:
  - task-2
  - task-3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Objective

Replace the sprite-grid generation workflow with a sequential frame-by-frame generation approach. Each frame is generated individually with cumulative context from previous frames, enabling better coherence and per-frame control. All frames are persisted as individual Assets.

## Context

Current workflow (`/api/gen-sprite`) generates a single sprite grid image with all animation frames combined. This limits control over individual frames and makes iteration difficult. The new approach generates frames sequentially, with each API call receiving previous frames as reference context.

## Key Decisions

**Sequential generation with cumulative context**: Each frame generation includes:
- The original character reference image
- All previously generated frames in the sequence
- Frame-specific prompt modifications

This enables the AI to maintain visual consistency across the sequence.

**Individual frame storage**: Each frame is a separate Asset (not extracted from a grid). This enables:
- Per-frame iteration and regeneration
- Frame reordering and substitution
- Clear provenance per frame

**Progressive prompt construction**: The API handler builds prompts dynamically:
- Base: System prompt + animation sequence description
- Per-frame: Optional frame-specific instructions (e.g., "arm raised high" for frame 2)
- Context: Reference to previous frames ("continue from previous frame", "maintain consistency")

**Batch vs. streaming**: Frames generated sequentially (not parallel) to ensure each frame has prior context. Progress updates sent to client as each frame completes.

## Requirements

### Frontend - Animation Form (Right Sidebar)
- Character selector (from project's characters)
- Selected character image preview
- Animation name/id input
- Sequence prompt textarea (overall animation description)
- Frame count selector
- Per-frame instruction inputs (optional, expandable)
  - Frame index label
  - Frame-specific prompt textarea
  - Collapsible by default, expand to add details
- Generate button with progress indicator
- Cancel generation option

### Frontend - Progress Display
- Show generation progress as frames complete
- Display each frame as it's generated
- Frame thumbnails appear sequentially
- Overall progress indicator (e.g., "Frame 3 of 8")
- Error handling with retry option per frame

### Backend - Sequential Generation API
- New route: `POST /api/gen-animation`
- Input: characterAssetId, animationName, sequencePrompt, frames (array with optional per-frame prompts)
- Process:
  1. Fetch character Asset from database
  2. For each frame (sequentially):
     a. Build prompt: system + sequence + frame-specific
     b. Collect reference images: character + all prior frames
     c. Call Gemini API with constructed prompt and references
     d. Save generated image as Asset with full provenance
     e. Create Frame record linking to Asset and Animation
     f. Send progress update (if streaming response)
  3. Return complete animation with all frame Assets

### Backend - Prompt Engineering
- System prompt template for animation frame generation
- Instructions for maintaining character consistency
- Instructions for animation continuity between frames
- Frame position context (first frame vs. middle vs. final)

### Asset Persistence
- Each frame saved following path convention:
  `public/assets/[projectId]/frames/[animationName]/[characterName]_[animationName]_[frameIndex].png`
- Asset record created with:
  - Reference to Animation
  - Frame index
  - Full prompt used
  - Reference asset IDs (character + prior frames)

### Database Updates
- Create Animation record before generating frames
- Create Frame records as each frame completes
- Handle partial completion (some frames succeed, some fail)

### Error Handling
- Individual frame failures shouldn't abort entire sequence
- Mark failed frames for retry
- Allow continuing from last successful frame
- Timeout handling for long-running sequences
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Animation form in right sidebar allows character selection, naming, and prompt entry
- [x] #2 Per-frame instruction inputs available for customizing individual frames
- [x] #3 API generates frames sequentially with each frame receiving prior frames as context
- [x] #4 Each generated frame saved as individual Asset with correct file path convention
- [x] #5 Frame and Animation records created in database with proper relationships
- [x] #6 Progress updates display in UI as each frame completes
- [ ] #7 Partial failures handled gracefully - can retry failed frames
- [ ] #8 Generated animation displays correctly in Animation view with ordered frames
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Progress (2026-01-02)

### Files Created
- `lib/config/animation-prompts.ts` - Prompt building helper with frame position context and angle support
- `app/api/gen-animation/route.ts` - SSE endpoint for sequential frame generation
- `components/ide/forms/generate-frames-form.tsx` - Form component with variation selector, angle dropdown, per-frame instructions, and live progress grid

### Files Modified
- `components/ide/right-sidebar.tsx` - Wired up GenerateFramesForm
- `lib/store.ts` - Added AnimationWithCharacterAsset type
- `app/api/animations/[id]/route.ts` - Include character.assets in response
- `components/ide/views/animation-view.tsx` - Updated local type to include assets

### Key Implementation Decisions
1. **SSE over polling**: Chose Server-Sent Events for real-time progress - better UX than polling, simpler than WebSockets
2. **Variation selector**: Added ability to select any character variation as reference (not just primary asset)
3. **Angle preset**: Added angle dropdown using existing characterPresets.angles, incorporated into frame prompts
4. **Frame path convention**: `public/assets/[projectId]/frames/[animationName]/[charName]_[animName]_[frameIdx]_[timestamp].png`
5. **Partial failure handling**: Individual frame errors send frame_error event but continue to next frame
6. **Cumulative context**: Each frame generation receives character image + all prior generated frames as references

### Remaining Work
- AC #1: Animation form exists but character selector is in new-animation-form (separate from generate-frames-form)
- AC #7: Retry failed frames UI not yet implemented (frames marked as failed, but no retry button)
- AC #8: Needs end-to-end testing
<!-- SECTION:NOTES:END -->
