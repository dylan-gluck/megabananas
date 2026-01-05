import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get the frame to find its animation
    const frame = await prisma.frame.findUnique({
      where: { id },
      select: { animationId: true, frameIndex: true },
    });

    if (!frame) {
      return notFound("Frame");
    }

    // Delete the frame
    await prisma.frame.delete({
      where: { id },
    });

    // Reindex remaining frames
    await prisma.frame.updateMany({
      where: {
        animationId: frame.animationId,
        frameIndex: { gt: frame.frameIndex },
      },
      data: {
        frameIndex: { decrement: 1 },
      },
    });

    // Update animation frame count
    const remainingFrames = await prisma.frame.count({
      where: { animationId: frame.animationId },
    });

    await prisma.animation.update({
      where: { id: frame.animationId },
      data: { frameCount: remainingFrames },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error deleting frame");
  }
}
