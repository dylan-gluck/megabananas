import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { buildExtractionPrompt } from "@/lib/config/sprite-extraction-prompts";
import { generateImage, type ImageContent } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

interface ExtractFramesRequest {
  animationId: string;
  spriteSheetId: string;
}

type SSEEvent =
  | { type: "start"; totalFrames: number }
  | { type: "frame_start"; index: number }
  | { type: "frame_complete"; index: number; assetId: string; filePath: string }
  | { type: "frame_error"; index: number; error: string }
  | { type: "complete"; totalGenerated: number }
  | { type: "error"; message: string };

async function loadImageAsBase64(filePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), "public", filePath);
  const buffer = fs.readFileSync(fullPath);
  return buffer.toString("base64");
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractFramesRequest = await request.json();
    const { animationId, spriteSheetId } = body;

    // Validate request
    if (!animationId || !spriteSheetId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch animation with character and project
    const animation = await prisma.animation.findUnique({
      where: { id: animationId },
      include: {
        character: true,
        project: true,
        frames: { orderBy: { frameIndex: "asc" } },
      },
    });

    if (!animation) {
      return new Response(JSON.stringify({ error: "Animation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch spritesheet with asset
    const spriteSheet = await prisma.spriteSheet.findUnique({
      where: { id: spriteSheetId },
      include: { asset: true },
    });

    if (!spriteSheet) {
      return new Response(JSON.stringify({ error: "Spritesheet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract generation settings from spritesheet
    const genSettings = spriteSheet.generationSettings as {
      frameCount?: number;
      cols?: number;
      rows?: number;
      anglePreset?: string;
    } | null;

    const frameCount = genSettings?.frameCount ?? 4;
    const cols = genSettings?.cols ?? frameCount;
    const rows = genSettings?.rows ?? 1;
    const anglePreset = genSettings?.anglePreset;

    // Load spritesheet image as base64
    let spriteSheetBase64: string;
    try {
      spriteSheetBase64 = await loadImageAsBase64(spriteSheet.asset.filePath);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to load spritesheet image" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: SSEEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        };

        sendEvent({ type: "start", totalFrames: frameCount });

        const extractedFrameImages: ImageContent[] = [];
        const startingIndex = animation.frames.length;
        let successCount = 0;

        // Ensure frame directory exists
        const animationSlug = sanitizeFilename(animation.name);
        const characterSlug = sanitizeFilename(animation.character.name);
        const frameDir = path.join(
          process.cwd(),
          "public",
          "assets",
          animation.project.id,
          "frames",
          animationSlug,
        );
        ensureDirectoryExists(frameDir);

        for (let i = 0; i < frameCount; i++) {
          const frameIndex = startingIndex + i;
          sendEvent({ type: "frame_start", index: frameIndex });

          try {
            // Determine reference mode
            const referenceMode: "sprite" | "dual" =
              i === 0 ? "sprite" : "dual";

            // Build extraction prompt
            const extractionPrompt = buildExtractionPrompt({
              frameIndex: i,
              totalFrames: frameCount,
              characterName: animation.character.name,
              animationName: animation.name,
              anglePreset,
              referenceMode,
              gridInfo: { cols, rows },
            });

            // Build reference images
            const spriteSheetRef: ImageContent = {
              mimeType: "image/png",
              data: spriteSheetBase64,
            };

            const referenceImages: ImageContent[] =
              i === 0
                ? [spriteSheetRef]
                : [spriteSheetRef, extractedFrameImages[i - 1]];

            // Generate (extract) frame
            const result = await generateImage(
              extractionPrompt,
              referenceImages,
              {
                aspectRatio: "1:1",
              },
            );

            // Save to filesystem
            const timestamp = Date.now();
            const filename = `${characterSlug}_${animationSlug}_${frameIndex}_${timestamp}.png`;
            const fullPath = path.join(frameDir, filename);
            const buffer = Buffer.from(result.image, "base64");
            fs.writeFileSync(fullPath, buffer);

            const filePath = `/assets/${animation.project.id}/frames/${animationSlug}/${filename}`;

            // Create Asset record
            const asset = await prisma.asset.create({
              data: {
                projectId: animation.projectId,
                filePath,
                type: "frame",
                systemPrompt: extractionPrompt,
                referenceAssetIds: [spriteSheet.assetId],
                generationSettings: {
                  sourceType: "spritesheet",
                  spriteSheetId,
                  frameIndex,
                  totalFrames: frameCount,
                  gridPosition: {
                    col: i % cols,
                    row: Math.floor(i / cols),
                  },
                },
              },
            });

            // Create Frame record
            await prisma.frame.create({
              data: {
                animationId,
                assetId: asset.id,
                frameIndex,
              },
            });

            // Update animation frameCount
            await prisma.animation.update({
              where: { id: animationId },
              data: { frameCount: frameIndex + 1 },
            });

            // Store extracted frame for next iteration
            extractedFrameImages.push({
              mimeType: "image/png",
              data: result.image,
            });
            successCount++;

            sendEvent({
              type: "frame_complete",
              index: frameIndex,
              assetId: asset.id,
              filePath,
            });
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Unknown error";
            console.error(
              `Frame ${frameIndex} extraction failed:`,
              errorMessage,
            );
            sendEvent({
              type: "frame_error",
              index: frameIndex,
              error: errorMessage,
            });
            // Continue to next frame - partial failure handling
          }
        }

        sendEvent({ type: "complete", totalGenerated: successCount });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("extract-frames-from-sprite error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Extraction failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
