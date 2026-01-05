import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { characterWithPrimaryAsset, spriteSheetWithAsset } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const spriteSheet = await prisma.spriteSheet.findUnique({
      where: { id },
      include: {
        character: {
          include: characterWithPrimaryAsset,
        },
        asset: true,
        project: true,
      },
    });

    if (!spriteSheet) {
      return notFound("Spritesheet");
    }

    return jsonSuccess(spriteSheet);
  } catch (error) {
    return serverError(error, "Error fetching spritesheet");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const spriteSheet = await prisma.spriteSheet.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: spriteSheetWithAsset,
    });

    return jsonSuccess(spriteSheet);
  } catch (error) {
    return serverError(error, "Error updating spritesheet");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const spriteSheet = await prisma.spriteSheet.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!spriteSheet) {
      return notFound("Spritesheet");
    }

    await prisma.spriteSheet.delete({ where: { id } });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error deleting spritesheet");
  }
}
