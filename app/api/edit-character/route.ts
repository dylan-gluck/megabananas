import type { NextRequest } from "next/server";
import { badRequest, jsonSuccess, serverError } from "@/lib/api/response";
import { saveImageToAssets } from "@/lib/file-utils";
import { editImage, type ImageContent } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const {
      sourceImage,
      prompt,
      referenceImages = [],
      aspectRatio,
    } = await request.json();

    if (!sourceImage || !prompt) {
      return badRequest("Source image and prompt are required");
    }

    const source: ImageContent = {
      mimeType: "image/png",
      data: sourceImage.replace(/^data:image\/\w+;base64,/, ""),
    };

    const refs: ImageContent[] = referenceImages.map((img: string) => ({
      mimeType: "image/png",
      data: img.replace(/^data:image\/\w+;base64,/, ""),
    }));

    const result = await editImage(source, prompt, refs, { aspectRatio });
    const filePath = saveImageToAssets(result.image, "characters", "char");

    return jsonSuccess({
      image: result.image,
      filePath,
      text: result.text,
    });
  } catch (error) {
    return serverError(error, "edit-character error");
  }
}
