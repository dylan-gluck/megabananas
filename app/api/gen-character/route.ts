import { type NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  type ImageContent,
  saveImageToFile,
} from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      systemPrompt,
      referenceImages = [],
      aspectRatio,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
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
    const filename = saveImageToFile(result.image, "characters", "char");

    return NextResponse.json({
      image: result.image,
      filename,
      text: result.text,
    });
  } catch (error) {
    console.error("gen-character error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
