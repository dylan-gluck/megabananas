import {
  badRequest,
  jsonCreated,
  serverError,
} from "@/lib/api/response";
import { sceneWithAsset } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      projectId,
      description,
      artStyle,
      mood,
      timeOfDay,
      environment,
      styleNotes,
    } = body;

    if (!name || typeof name !== "string") {
      return badRequest("Scene name is required");
    }

    if (!projectId || typeof projectId !== "string") {
      return badRequest("Project ID is required");
    }

    const scene = await prisma.scene.create({
      data: {
        name,
        projectId,
        description: description || null,
        artStyle: artStyle || null,
        mood: mood || null,
        timeOfDay: timeOfDay || null,
        environment: environment || null,
        styleNotes: styleNotes || null,
      },
      include: sceneWithAsset,
    });

    return jsonCreated(scene);
  } catch (error) {
    return serverError(error, "Error creating scene");
  }
}
