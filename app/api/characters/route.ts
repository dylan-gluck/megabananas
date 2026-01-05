import {
  badRequest,
  jsonCreated,
  serverError,
} from "@/lib/api/response";
import { characterWithPrimaryAsset } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, projectId, userPrompt, primaryAssetId } = body;

    if (!name || typeof name !== "string") {
      return badRequest("Character name is required");
    }

    if (!projectId || typeof projectId !== "string") {
      return badRequest("Project ID is required");
    }

    const character = await prisma.character.create({
      data: {
        name,
        projectId,
        userPrompt: userPrompt || null,
        primaryAssetId: primaryAssetId || null,
      },
      include: characterWithPrimaryAsset,
    });

    return jsonCreated(character);
  } catch (error) {
    return serverError(error, "Error creating character");
  }
}
