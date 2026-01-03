import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: animationId } = await params;
    const { frameIds } = await request.json();

    if (!Array.isArray(frameIds)) {
      return NextResponse.json(
        { error: "frameIds must be an array" },
        { status: 400 },
      );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering frames:", error);
    return NextResponse.json(
      { error: "Failed to reorder frames" },
      { status: 500 },
    );
  }
}
