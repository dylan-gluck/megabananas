// SSE event types for generation endpoints
export type SSEEvent =
  | { type: "start"; totalFrames: number }
  | { type: "frame_start"; index: number }
  | { type: "frame_complete"; index: number; assetId: string; filePath: string }
  | { type: "frame_error"; index: number; error: string }
  | { type: "complete"; totalGenerated: number }
  | { type: "error"; message: string };

// Animation generation request types
export interface PerFrameInstruction {
  index: number;
  prompt: string;
}

export interface GenerateAnimationRequest {
  animationId: string;
  characterAssetId: string;
  sequencePrompt: string;
  frameCount: number;
  anglePreset?: string;
  perFrameInstructions?: PerFrameInstruction[];
}

// Character generation request types
export interface GenerateCharacterRequest {
  prompt: string;
  systemPrompt?: string;
  referenceImages?: string[];
  aspectRatio?: string;
}

// Spritesheet generation request types
export interface GenerateSpritesheetRequest {
  characterId: string;
  characterAssetId: string;
  name: string;
  description: string;
  frameCount: number;
  anglePreset?: string;
}

// CRUD request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateCharacterRequest {
  name: string;
  projectId: string;
  userPrompt?: string;
  primaryAssetId?: string;
}

export interface CreateAnimationRequest {
  name: string;
  characterId: string;
  description?: string;
  frameCount?: number;
  generationConfig?: Record<string, unknown>;
}

export interface CreateAssetRequest {
  projectId: string;
  filePath: string;
  type?: string;
  systemPrompt?: string;
  userPrompt?: string;
  referenceAssetIds?: string[];
  generationSettings?: Record<string, unknown>;
  characterId?: string;
}

// API error response type
export interface ApiError {
  error: string;
}
