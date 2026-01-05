import {
  badRequest,
  jsonCreated,
  notFound,
  serverError,
} from "@/lib/api/response";
import { spriteSheetWithAsset } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, characterId, description, assetId, generationSettings } =
      body;

    if (!name || typeof name !== "string") {
      return badRequest("Spritesheet name is required");
    }

    if (!characterId || typeof characterId !== "string") {
      return badRequest("Character ID is required");
    }

    if (!assetId || typeof assetId !== "string") {
      return badRequest("Asset ID is required");
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { projectId: true },
    });

    if (!character) {
      return notFound("Character");
    }

    const spriteSheet = await prisma.spriteSheet.create({
      data: {
        name,
        characterId,
        projectId: character.projectId,
        description: description || null,
        assetId,
        generationSettings: generationSettings || null,
      },
      include: spriteSheetWithAsset,
    });

    return jsonCreated(spriteSheet);
  } catch (error) {
    return serverError(error, "Error creating spritesheet");
  }
}
