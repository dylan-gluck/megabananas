import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { animationWithCharacterAssets, animationWithFrames } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const animation = await prisma.animation.findUnique({
      where: { id },
      include: animationWithCharacterAssets,
    });

    if (!animation) {
      return notFound("Animation");
    }

    return jsonSuccess(animation);
  } catch (error) {
    return serverError(error, "Error fetching animation");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, frameCount } = body;

    const animation = await prisma.animation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(frameCount !== undefined && { frameCount }),
      },
      include: animationWithFrames,
    });

    return jsonSuccess(animation);
  } catch (error) {
    return serverError(error, "Error updating animation");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.animation.delete({
      where: { id },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error deleting animation");
  }
}
