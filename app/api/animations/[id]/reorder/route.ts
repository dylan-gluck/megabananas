import { badRequest, jsonSuccess, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: animationId } = await params;
    const { frameIds } = await request.json();

    if (!Array.isArray(frameIds)) {
      return badRequest("frameIds must be an array");
    }

    // Update each frame's index in a transaction, scoped to this animation
    await prisma.$transaction(
      frameIds.map((frameId: string, index: number) =>
        prisma.frame.update({
          where: { id: frameId, animationId },
          data: { frameIndex: index },
        }),
      ),
    );

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error reordering frames");
  }
}
