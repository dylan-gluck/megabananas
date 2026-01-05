import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type ImageContent = {
  mimeType: string;
  data: string; // base64
};

export type GenerateImageConfig = {
  aspectRatio?: string;
  resolution?: string;
};

export async function generateImage(
  prompt: string,
  referenceImages: ImageContent[] = [],
  config: GenerateImageConfig = {},
): Promise<{ image: string; text?: string }> {
  const contents: Array<{ text: string } | { inlineData: ImageContent }> = [
    { text: prompt },
    ...referenceImages.map((img) => ({ inlineData: img })),
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: config.aspectRatio || "1:1",
        imageSize: config.resolution || "1K",
      },
    },
  });

  let image = "";
  let text = "";

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if ("text" in part && part.text) {
      text = part.text;
    } else if ("inlineData" in part && part.inlineData) {
      image = part.inlineData.data as string;
    }
  }

  if (!image) {
    throw new Error("No image generated");
  }

  return { image, text: text || undefined };
}

export async function editImage(
  sourceImage: ImageContent,
  prompt: string,
  referenceImages: ImageContent[] = [],
  config: GenerateImageConfig = {},
): Promise<{ image: string; text?: string }> {
  const contents: Array<{ text: string } | { inlineData: ImageContent }> = [
    { inlineData: sourceImage },
    { text: prompt },
    ...referenceImages.map((img) => ({ inlineData: img })),
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: config.aspectRatio || "1:1",
        imageSize: config.resolution || "1K",
      },
    },
  });

  let image = "";
  let text = "";

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if ("text" in part && part.text) {
      text = part.text;
    } else if ("inlineData" in part && part.inlineData) {
      image = part.inlineData.data as string;
    }
  }

  if (!image) {
    throw new Error("No image generated");
  }

  return { image, text: text || undefined };
}
