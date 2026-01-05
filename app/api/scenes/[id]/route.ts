import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { sceneWithDetails, sceneWithAsset } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const scene = await prisma.scene.findUnique({
      where: { id },
      include: sceneWithDetails,
    });

    if (!scene) {
      return notFound("Scene");
    }

    return jsonSuccess(scene);
  } catch (error) {
    return serverError(error, "Error fetching scene");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      artStyle,
      mood,
      timeOfDay,
      environment,
      styleNotes,
      primaryAssetId,
    } = body;

    const scene = await prisma.scene.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(artStyle !== undefined && { artStyle }),
        ...(mood !== undefined && { mood }),
        ...(timeOfDay !== undefined && { timeOfDay }),
        ...(environment !== undefined && { environment }),
        ...(styleNotes !== undefined && { styleNotes }),
        ...(primaryAssetId !== undefined && { primaryAssetId }),
      },
      include: sceneWithAsset,
    });

    return jsonSuccess(scene);
  } catch (error) {
    return serverError(error, "Error updating scene");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.scene.delete({
      where: { id },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error deleting scene");
  }
}
