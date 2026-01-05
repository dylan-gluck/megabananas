import type { NextRequest } from "next/server";
import { badRequest, jsonSuccess, serverError } from "@/lib/api/response";
import { saveImageToAssets } from "@/lib/file-utils";
import { generateImage, type ImageContent } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      systemPrompt,
      referenceImages = [],
      aspectRatio,
    } = await request.json();

    if (!prompt) {
      return badRequest("Prompt is required");
    }

    // Combine system prompt with user prompt
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\nCharacter description: ${prompt}`
      : prompt;

    const refs: ImageContent[] = referenceImages.map((img: string) => ({
      mimeType: "image/png",
      data: img.replace(/^data:image\/\w+;base64,/, ""),
    }));

    const result = await generateImage(fullPrompt, refs, { aspectRatio });
    const filePath = saveImageToAssets(result.image, "characters", "char");

    return jsonSuccess({
      image: result.image,
      filePath,
      text: result.text,
    });
  } catch (error) {
    return serverError(error, "gen-character error");
  }
}
