import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { buildFramePrompt } from "@/lib/config/animation-prompts";
import { generateImage, type ImageContent } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

interface PerFrameInstruction {
  index: number;
  prompt: string;
}

interface GenerateAnimationRequest {
  animationId: string;
  characterAssetId: string;
  sequencePrompt: string;
  frameCount: number;
  anglePreset?: string;
  perFrameInstructions?: PerFrameInstruction[];
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
    const body: GenerateAnimationRequest = await request.json();
    const {
      animationId,
      characterAssetId,
      sequencePrompt,
      frameCount,
      anglePreset,
      perFrameInstructions,
    } = body;

    // Validate request
    if (!animationId || !characterAssetId || !sequencePrompt || !frameCount) {
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

    // Fetch character asset
    const characterAsset = await prisma.asset.findUnique({
      where: { id: characterAssetId },
    });

    if (!characterAsset) {
      return new Response(
        JSON.stringify({ error: "Character asset not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Load character image as base64
    let characterImageBase64: string;
    try {
      characterImageBase64 = await loadImageAsBase64(characterAsset.filePath);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to load character image" }),
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

        const generatedFrameImages: ImageContent[] = [];
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
            // Build prompt for this frame
            const perFrameInstruction = perFrameInstructions?.find(
              (f) => f.index === i,
            )?.prompt;

            // Determine reference mode for prompt context
            const referenceMode: "character" | "previous" | "dual" =
              i === 0 ? "character" : i >= 4 ? "dual" : "previous";

            const framePrompt = buildFramePrompt({
              sequencePrompt,
              frameIndex: i,
              totalFrames: frameCount,
              perFrameInstruction,
              characterName: animation.character.name,
              animationName: animation.name,
              anglePreset,
              referenceMode,
            });

            // Build reference images:
            // - Frame 0: character image only (establish character)
            // - Frame 1-3: previous frame only (short sequences)
            // - Frame 4+: character image + previous frame (prevent style drift)
            const characterRef: ImageContent = {
              mimeType: "image/png",
              data: characterImageBase64,
            };
            const referenceImages: ImageContent[] =
              i === 0
                ? [characterRef]
                : i >= 4
                  ? [characterRef, generatedFrameImages[i - 1]]
                  : [generatedFrameImages[i - 1]];

            // Generate frame
            const result = await generateImage(framePrompt, referenceImages, {
              aspectRatio: "1:1",
            });

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
                systemPrompt: framePrompt,
                userPrompt: perFrameInstruction || null,
                referenceAssetIds: [characterAssetId],
                generationSettings: {
                  sequencePrompt,
                  frameIndex,
                  totalFrames: frameCount,
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

            // Add to reference context for next frame
            generatedFrameImages.push({
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
              `Frame ${frameIndex} generation failed:`,
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
    console.error("gen-animation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Generation failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
