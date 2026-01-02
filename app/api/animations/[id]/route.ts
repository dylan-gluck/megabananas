import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const animation = await prisma.animation.findUnique({
      where: { id },
      include: {
        character: {
          include: {
            primaryAsset: true,
            assets: true,
          },
        },
        frames: {
          orderBy: { frameIndex: "asc" },
          include: { asset: true },
        },
        project: true,
      },
    });

    if (!animation) {
      return NextResponse.json(
        { error: "Animation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(animation);
  } catch (error) {
    console.error("Error fetching animation:", error);
    return NextResponse.json(
      { error: "Failed to fetch animation" },
      { status: 500 },
    );
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
      include: {
        character: true,
        frames: {
          orderBy: { frameIndex: "asc" },
          include: { asset: true },
        },
      },
    });

    return NextResponse.json(animation);
  } catch (error) {
    console.error("Error updating animation:", error);
    return NextResponse.json(
      { error: "Failed to update animation" },
      { status: 500 },
    );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting animation:", error);
    return NextResponse.json(
      { error: "Failed to delete animation" },
      { status: 500 },
    );
  }
}
