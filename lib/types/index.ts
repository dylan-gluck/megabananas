// Re-export base types from Prisma generated client
export type {
  Project,
  Asset,
  Character,
  Frame,
} from "@/lib/generated/prisma/client";

// Re-export enums
export { AssetType } from "@/lib/generated/prisma/client";

// Extended types with relations
import type {
  Project,
  Asset,
  Character,
  Animation as PrismaAnimation,
  Frame,
  SpriteSheet as PrismaSpriteSheet,
} from "@/lib/generated/prisma/client";

// Typed generation settings
export interface AnimationGenerationSettings {
  characterAssetId: string;
  anglePreset?: string;
}

export interface SpriteSheetGenerationSettings {
  characterAssetId: string;
  anglePreset?: string;
  frameCount: number;
  cols: number;
  rows?: number;
  aspectRatio?: string;
}

// Animation with typed generationSettings
export interface Animation extends Omit<PrismaAnimation, "generationSettings"> {
  generationSettings: AnimationGenerationSettings | null;
}

// SpriteSheet with typed generationSettings
export interface SpriteSheet extends Omit<PrismaSpriteSheet, "generationSettings"> {
  generationSettings: SpriteSheetGenerationSettings | null;
}

export interface FrameWithAsset extends Frame {
  asset: Asset;
}

export interface AnimationWithFrames extends Animation {
  character: Character;
  frames: FrameWithAsset[];
}

export interface SpriteSheetWithAsset extends SpriteSheet {
  asset: Asset;
  character: Character;
}

export interface CharacterWithAssets extends Character {
  primaryAsset: Asset | null;
  assets: Asset[];
  animations: AnimationWithFrames[];
  spriteSheets: SpriteSheetWithAsset[];
}

export interface ProjectWithRelations extends Project {
  characters: CharacterWithAssets[];
}

// Extended animation type with character's primary asset and variations for generation
export interface AnimationWithCharacterAsset extends AnimationWithFrames {
  character: Character & { primaryAsset: Asset | null; assets: Asset[] };
}
