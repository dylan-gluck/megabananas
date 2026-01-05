import type { NextRequest } from "next/server";
import { badRequest, jsonSuccess, serverError } from "@/lib/api/response";
import { saveImageToAssets } from "@/lib/file-utils";
import { editImage, type ImageContent } from "@/lib/gemini";

type Sequence = {
  name: string;
  description: string;
  frames: number;
};

export async function POST(request: NextRequest) {
  try {
    const { characterImage, sequences } = await request.json();

    if (!characterImage || !sequences?.length) {
      return badRequest("Character image and sequences are required");
    }

    const source: ImageContent = {
      mimeType: "image/png",
      data: characterImage.replace(/^data:image\/\w+;base64,/, ""),
    };

    // Build sprite sheet prompt
    const sequenceDescriptions = (sequences as Sequence[])
      .map((seq) => `- ${seq.name}: ${seq.description} (${seq.frames} frames)`)
      .join("\n");

    const totalFrames = (sequences as Sequence[]).reduce(
      (sum, seq) => sum + seq.frames,
      0,
    );
    const cols = Math.ceil(Math.sqrt(totalFrames));

    const prompt = `Create a sprite sheet grid for this character with the following animation sequences:

${sequenceDescriptions}

Requirements:
- Arrange all frames in a grid layout (approximately ${cols} columns)
- Each frame should show the character in a clear pose for animation
- Maintain consistent character design across all frames
- Use a transparent or solid color background
- Keep frames evenly spaced for easy extraction
- Total frames: ${totalFrames}`;

    const result = await editImage(source, prompt, [], {
      aspectRatio: "1:1",
      resolution: "2K",
    });
    const filePath = saveImageToAssets(result.image, "sprites", "sprite");

    return jsonSuccess({
      spriteGrid: result.image,
      filePath,
      text: result.text,
    });
  } catch (error) {
    return serverError(error, "gen-sprite error");
  }
}
