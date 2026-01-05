import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { characterPresets } from "@/lib/config/character-presets";
import { editImage, type ImageContent } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

// Layout configuration for different frame counts
function getLayoutConfig(frameCount: number): { aspectRatio: string; cols: number; rows: number } {
  // Available ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
  if (frameCount <= 4) return { aspectRatio: "21:9", cols: frameCount, rows: 1 };
  if (frameCount <= 8) return { aspectRatio: "21:9", cols: frameCount, rows: 1 };
  if (frameCount <= 12) return { aspectRatio: "3:2", cols: 6, rows: 2 };
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

  // Build step-by-step motion narrative
  const frameProgression = Array.from({ length: frameCount }, (_, i) => {
    const position = i / (frameCount - 1); // 0 to 1
    if (position === 0) return `Frame ${i + 1}: Starting pose`;
    if (position === 1) return `Frame ${i + 1}: End pose (ready to loop back)`;
    if (position < 0.5) return `Frame ${i + 1}: Early motion (${Math.round(position * 100)}% through)`;
    return `Frame ${i + 1}: Late motion (${Math.round(position * 100)}% through)`;
  }).join("\n");

  const layoutDesc = rows === 1
    ? `Arrange exactly ${frameCount} frames in a single horizontal row, evenly spaced left to right.`
    : `Arrange exactly ${frameCount} frames in a ${cols}×${rows} grid (${cols} columns, ${rows} rows). Frames read left-to-right, top-to-bottom.`;

  return `Create a ${frameCount}-frame animation sprite sheet for this character.

ANIMATION: "${animationName}"
${description}

CHARACTER PRESERVATION (CRITICAL):
Ensure that ALL visual features of this character remain EXACTLY unchanged across every frame:
- Same face, hair, clothing, colors, proportions, and style
- Same level of detail and rendering quality
- Only the pose and position should change, nothing else about the character's appearance

LAYOUT:
${layoutDesc}
Each frame shows the character${angleFragment} at a different point in the animation cycle.

ANIMATION SEQUENCE:
${frameProgression}

The motion should be smooth and cyclical - frame ${frameCount} should transition naturally back to frame 1 for seamless looping. Show clear, distinct poses that read well as animation keyframes.

BACKGROUND: Use the exact same solid background color as the reference image for all frames.`;
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
      return NextResponse.json(
        {
          error:
            "characterId, characterAssetId, name, description, and frameCount are required",
        },
        { status: 400 },
      );
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { project: true },
    });
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    const characterAsset = await prisma.asset.findUnique({
      where: { id: characterAssetId },
    });
    if (!characterAsset) {
      return NextResponse.json(
        { error: "Character asset not found" },
        { status: 404 },
      );
    }

    // Read character image as base64
    const imagePath = path.join(
      process.cwd(),
      "public",
      characterAsset.filePath,
    );
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

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
    const prompt = buildSpritesheetPrompt(name, description, frameCount, angleFragment);

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

    fs.mkdirSync(spritesheetsDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = name.replace(/\s+/g, "-").toLowerCase();
    const filename = `${safeName}_${timestamp}.png`;
    const filePath = `/assets/${projectId}/spritesheets/${filename}`;
    const fullPath = path.join(spritesheetsDir, filename);

    const buffer = Buffer.from(result.image, "base64");
    fs.writeFileSync(fullPath, buffer);

    // Create Asset record
    const asset = await prisma.asset.create({
      data: {
        projectId,
        filePath,
        type: "spritesheet",
        systemPrompt: prompt,
        userPrompt: name,
        referenceAssetIds: [characterAssetId],
        generationSettings: { description, frameCount, anglePreset, aspectRatio, cols, rows },
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
      include: {
        asset: true,
        character: true,
      },
    });

    return NextResponse.json({
      spriteSheet,
      spriteGrid: result.image,
      text: result.text,
    });
  } catch (error) {
    console.error("gen-spritesheet error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Spritesheet generation failed",
      },
      { status: 500 },
    );
  }
}
