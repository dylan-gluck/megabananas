---
id: task-10
title: Context & Prompt-engineering Updates
status: To Do
assignee: []
created_date: '2026-01-04 22:09'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add project-level art style/theme metadata and create a prompt-improver utility that enriches user prompts with context before sending to Gemini.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Project model extended with artStyle, theme, colorPalette, and notes fields
- [ ] #2 New project dialog captures art style metadata on creation
- [ ] #3 Project detail view displays style metadata section
- [ ] #4 lib/prompt-improver.ts exports improvePrompt(userPrompt, contextJson) using gemini-3-pro-preview
- [ ] #5 gen-character route uses prompt improver with project metadata
- [ ] #6 gen-spritesheet route uses prompt improver with project+character metadata
- [ ] #7 gen-animation route uses prompt improver with project+character metadata
- [ ] #8 edit-character route uses prompt improver with project+character metadata
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update prisma schema: add artStyle, theme, colorPalette (string array), styleNotes to Project model
2. Run db:generate and db:push
3. Update POST /api/projects to accept new fields
4. Update left-sidebar new-project dialog with art style, theme, color inputs
5. Update project-view.tsx to display style metadata in header section
6. Create lib/prompt-improver.ts:
   - Export type PromptContext with project/character metadata fields
   - Export improvePrompt(userPrompt: string, context: PromptContext): Promise<string>
   - Use GoogleGenAI with gemini-3-pro-preview model
   - System prompt instructs LLM to expand user prompt into detailed visual description
7. Update gen-character/route.ts: fetch project, call improvePrompt with project context
8. Update gen-spritesheet/route.ts: call improvePrompt with project+character context
9. Update gen-animation/route.ts: call improvePrompt with project+character context
10. Update edit-character/route.ts: fetch context and call improvePrompt
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Key files:
- prisma/schema.prisma: Project model
- app/api/projects/route.ts: POST handler
- components/ide/left-sidebar.tsx: new project dialog (lines 173-208)
- components/ide/views/project-view.tsx: project header (lines 156-174)
- lib/gemini.ts: existing Gemini integration pattern
- app/api/gen-character/route.ts: character generation
- app/api/gen-spritesheet/route.ts: spritesheet generation
- app/api/gen-animation/route.ts: animation frame generation
- app/api/edit-character/route.ts: character editing

Prompt improver should produce extremely descriptive output suitable for image generation, incorporating art style, theme, and color palette from project context.
<!-- SECTION:NOTES:END -->
