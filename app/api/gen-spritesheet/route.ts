import path from "node:path";
import type { NextRequest } from "next/server";
import { badRequest, jsonSuccess, notFound, serverError } from "@/lib/api/response";
import { characterPresets } from "@/lib/config/character-presets";
import {
  ensureDirectoryExists,
  loadImageAsBase64,
  saveBase64Image,
  sanitizeFilename,
} from "@/lib/file-utils";
import { editImage, type ImageContent } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { spriteSheetWithAsset } from "@/lib/db/includes";

// Layout configuration for different frame counts
function getLayoutConfig(frameCount: number): {
  aspectRatio: string;
  cols: number;
  rows: number;
} {
  // Available ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
  if (frameCount === 4)
    return { aspectRatio: "1:1", cols: 2, rows: 2 };
  if (frameCount <= 8)
    return { aspectRatio: "21:9", cols: frameCount, rows: 1 };
  if (frameCount <= 10)
    return { aspectRatio: "21:9", cols: 5, rows: 2 };
  if (frameCount <= 16) return { aspectRatio: "16:9", cols: 8, rows: 2 };
  return { aspectRatio: "3:2", cols: 8, rows: 3 }; // 24 frames: 8x3
}

function buildSpritesheetPrompt(
  animationName: string,
  description: string,
  frameCount: number,
  angleFragment: string,
): string {
  const { cols, rows } = getLayoutConfig(frameCount);

  const gridDesc =
    rows === 1
      ? `${cols} columns, 1 row (single horizontal strip)`
      : `${cols} columns, ${rows} rows`;

  return `EXACTLY ${frameCount} FRAMES. NOT ${frameCount - 1}, NOT ${frameCount + 1}. EXACTLY ${frameCount}.

Create a sprite sheet: ${frameCount} animation frames of this character performing "${animationName}" (${description}).

LAYOUT: ${gridDesc}
- Uniform grid, all cells IDENTICAL size, edge-to-edge with NO gaps
- NO borders, NO lines, NO dividers, NO separators between frames
- Solid background color fills everything, frames touch seamlessly

EACH FRAME:
- Character${angleFragment} centered in cell at same scale and baseline
- Same character appearance in every frame (face, colors, proportions, style)
- Only pose changes for animation

Frame 1 = start pose, Frame ${frameCount} = end pose ready to loop back to frame 1.
Smooth motion progression across all ${frameCount} frames.

MANDATORY: Output EXACTLY ${frameCount} frames in a ${gridDesc} layout. Count them.`;
}

export async function POST(request: NextRequest) {
  try {
    const {
      characterId,
      characterAssetId,
      name,
      description,
      frameCount,
      anglePreset,
    } = await request.json();

    if (
      !characterId ||
      !characterAssetId ||
      !name ||
      !description ||
      !frameCount
    ) {
      return badRequest(
        "characterId, characterAssetId, name, description, and frameCount are required"
      );
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { project: true },
    });
    if (!character) {
      return notFound("Character");
    }

    const characterAsset = await prisma.asset.findUnique({
      where: { id: characterAssetId },
    });
    if (!characterAsset) {
      return notFound("Character asset");
    }

    // Read character image as base64
    const base64Image = await loadImageAsBase64(characterAsset.filePath);

    const source: ImageContent = {
      mimeType: "image/png",
      data: base64Image,
    };

    // Get angle preset prompt fragment
    const angleOption = characterPresets.angles.find(
      (a) => a.value === anglePreset,
    );
    const angleFragment = angleOption ? ` ${angleOption.promptFragment}` : "";

    // Build structured prompt with narrative description
    const prompt = buildSpritesheetPrompt(
      name,
      description,
      frameCount,
      angleFragment,
    );

    // Get layout configuration for frame count
    const { aspectRatio, cols, rows } = getLayoutConfig(frameCount);

    // Generate spritesheet
    const result = await editImage(source, prompt, [], {
      aspectRatio,
      resolution: "2K",
    });

    // Save to project-based path
    const projectId = character.projectId;
    const spritesheetsDir = path.join(
      process.cwd(),
      "public",
      "assets",
      projectId,
      "spritesheets",
    );

    ensureDirectoryExists(spritesheetsDir);

    const timestamp = Date.now();
    const safeName = sanitizeFilename(name);
    const filename = `${safeName}_${timestamp}.png`;
    const filePath = `/assets/${projectId}/spritesheets/${filename}`;

    saveBase64Image(result.image, spritesheetsDir, filename);

    // Create Asset record
    const asset = await prisma.asset.create({
      data: {
        projectId,
        filePath,
        type: "spritesheet",
        systemPrompt: prompt,
        userPrompt: name,
        referenceAssetIds: [characterAssetId],
        generationSettings: {
          description,
          frameCount,
          anglePreset,
          aspectRatio,
          cols,
          rows,
        },
        characterId,
      },
    });

    // Create SpriteSheet record
    const spriteSheet = await prisma.spriteSheet.create({
      data: {
        name,
        characterId,
        projectId,
        description,
        assetId: asset.id,
        generationSettings: {
          characterAssetId,
          anglePreset,
          frameCount,
          aspectRatio,
          cols,
          rows,
        },
      },
      include: spriteSheetWithAsset,
    });

    return jsonSuccess({
      spriteSheet,
      spriteGrid: result.image,
      text: result.text,
    });
  } catch (error) {
    return serverError(error, "gen-spritesheet error");
  }
}
