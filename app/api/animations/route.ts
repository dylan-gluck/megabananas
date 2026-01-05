import {
  badRequest,
  jsonCreated,
  notFound,
  serverError,
} from "@/lib/api/response";
import { animationWithFrames } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, characterId, description, frameCount, generationConfig } =
      body;

    if (!name || typeof name !== "string") {
      return badRequest("Animation name is required");
    }

    if (!characterId || typeof characterId !== "string") {
      return badRequest("Character ID is required");
    }

    // Get the character to find its projectId
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { projectId: true },
    });

    if (!character) {
      return notFound("Character");
    }

    const animation = await prisma.animation.create({
      data: {
        name,
        characterId,
        projectId: character.projectId,
        description: description || null,
        frameCount: frameCount || 4,
        generationSettings: generationConfig || null,
      },
      include: animationWithFrames,
    });

    return jsonCreated(animation);
  } catch (error) {
    return serverError(error, "Error creating animation");
  }
}
