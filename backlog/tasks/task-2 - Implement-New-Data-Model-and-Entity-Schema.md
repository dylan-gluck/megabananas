---
id: task-2
title: Implement New Data Model and Entity Schema
status: Done
assignee: []
created_date: '2026-01-02 00:18'
updated_date: '2026-01-02 01:04'
labels:
  - database
  - data-model
  - prisma
dependencies:
  - task-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Objective

Design and implement a comprehensive data model that supports project-based organization, asset management with provenance tracking, and the new animation workflow. All generated images become tracked Assets with full metadata.

## Context

Current app has minimal types (`Sequence`, `ImageContent`) with no persistent entities. The new model introduces proper entity relationships enabling project organization, generation history, and the frame-based animation workflow.

## Key Decisions

**Project as top-level container**: All work is organized into Projects. This enables multi-project support, project-level settings, and clean data isolation.

**Asset as unified image storage**: Every image (uploaded references, generated characters, animation frames) is an Asset with:
- Unique identifier (UUID)
- Relative file path following convention
- Creation/update timestamps
- Tags for categorization
- Generation provenance (prompts, reference asset IDs used)

**File path conventions**: Organized, predictable paths enable both file-system browsing and database lookups:
- Characters: `public/assets/[projectId]/characters/[characterName]_[assetId].png`
- Frames: `public/assets/[projectId]/frames/[animationName]/[characterName]_[animationName]_[frameIndex].png`
- References: `public/assets/[projectId]/references/[assetId].png`

**Generation provenance**: Every generated Asset stores:
- System prompt used
- User prompt used
- Array of reference Asset IDs that were inputs
- Generation settings (aspect ratio, etc.)

**Character variations**: Characters can have multiple generated variations (same prompt, different outputs). One variation is marked as "primary" for use as default reference.

## Requirements

### Core Entities

**Project**
- id, name, description, tags
- thumbnail (FK to Asset)
- settings (JSON for project-level generation defaults)
- createdAt, updatedAt

**Asset**
- id (UUID), projectId (FK)
- filePath (relative path within public/assets/)
- mimeType, fileSize
- tags (array)
- generationPrompt (nullable - null for uploaded assets)
- generationSystemPrompt (nullable)
- referenceAssetIds (array of Asset IDs used as inputs)
- generationSettings (JSON)
- createdAt, updatedAt

**Character**
- id, projectId (FK), name, description, tags
- userPrompt (the generation prompt)
- primaryAssetId (FK to Asset - the main character image)
- generationSettings (JSON)
- createdAt, updatedAt

**Animation**
- id, characterId (FK), name, description
- userPrompt (sequence description)
- frameCount (derived or stored)
- createdAt, updatedAt

**Frame**
- id, animationId (FK), assetId (FK)
- frameIndex (position in sequence)
- framePrompt (optional per-frame instructions)
- createdAt

### Relationships
- Project has many Characters, Assets
- Character has many Animations, Assets (variations)
- Animation has many Frames
- Frame references one Asset
- Asset can be referenced by Character (primary), Frame, or other Assets (as generation input)

### Migration
- Create migration for complete schema
- Ensure indexes on foreign keys and common query patterns (projectId, characterId, etc.)

### Prisma Client
- Generate client with all models
- Verify type inference works correctly in IDE
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All entities (Project, Asset, Character, Animation, Frame) defined in Prisma schema
- [ ] #2 Relationships correctly modeled with foreign keys and cascading deletes where appropriate
- [ ] #3 Asset entity includes all provenance fields (prompts, referenceAssetIds, settings)
- [ ] #4 Migration runs successfully against local PostgreSQL
- [ ] #5 Prisma client types available for all entities in TypeScript
- [ ] #6 Can create a Project with Characters, Animations, Frames, and Assets through Prisma client
<!-- AC:END -->
