import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Include pattern for Frame with its Asset.
 */
export const frameWithAsset = {
  asset: true,
} satisfies Prisma.FrameInclude;

/**
 * Include pattern for Animation with Character and Frames.
 */
export const animationWithFrames = {
  character: true,
  frames: {
    orderBy: { frameIndex: "asc" },
    include: frameWithAsset,
  },
} satisfies Prisma.AnimationInclude;

/**
 * Include pattern for SpriteSheet with Asset and Character.
 */
export const spriteSheetWithAsset = {
  asset: true,
  character: true,
} satisfies Prisma.SpriteSheetInclude;

/**
 * Include pattern for Character with primary asset and assets.
 */
export const characterWithPrimaryAsset = {
  primaryAsset: true,
  assets: true,
} satisfies Prisma.CharacterInclude;

/**
 * Include pattern for Character with all assets (excludes spritesheets).
 */
export const characterWithAssetsNoSpritesheets = {
  primaryAsset: true,
  assets: {
    where: { type: { not: "spritesheet" } },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.CharacterInclude;

/**
 * Full Character include pattern with animations and spritesheets.
 */
export const characterWithAssets = {
  primaryAsset: true,
  assets: true,
  animations: {
    orderBy: { updatedAt: "desc" },
    include: animationWithFrames,
  },
  spriteSheets: {
    orderBy: { updatedAt: "desc" },
    include: spriteSheetWithAsset,
  },
} satisfies Prisma.CharacterInclude;

/**
 * Full Character include pattern for detail views.
 */
export const characterWithDetails = {
  ...characterWithAssetsNoSpritesheets,
  animations: {
    orderBy: { updatedAt: "desc" },
    include: {
      frames: {
        orderBy: { frameIndex: "asc" },
        include: frameWithAsset,
      },
    },
  },
  spriteSheets: {
    orderBy: { updatedAt: "desc" },
    include: { asset: true },
  },
  project: true,
} satisfies Prisma.CharacterInclude;

/**
 * Full Project include pattern with all relations.
 */
export const projectWithRelations = {
  characters: {
    orderBy: { updatedAt: "desc" },
    include: characterWithAssets,
  },
} satisfies Prisma.ProjectInclude;

/**
 * Animation include pattern with character's primary asset and variations.
 */
export const animationWithCharacterAssets = {
  character: {
    include: {
      primaryAsset: true,
      assets: true,
    },
  },
  frames: {
    orderBy: { frameIndex: "asc" },
    include: frameWithAsset,
  },
  project: true,
} satisfies Prisma.AnimationInclude;
