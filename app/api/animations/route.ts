import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, characterId, description, frameCount, generationConfig } =
      body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Animation name is required" },
        { status: 400 },
      );
    }

    if (!characterId || typeof characterId !== "string") {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 },
      );
    }

    // Get the character to find its projectId
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { projectId: true },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
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
      include: {
        character: true,
        frames: {
          orderBy: { frameIndex: "asc" },
          include: { asset: true },
        },
      },
    });

    return NextResponse.json(animation, { status: 201 });
  } catch (error) {
    console.error("Error creating animation:", error);
    return NextResponse.json(
      { error: "Failed to create animation" },
      { status: 500 },
    );
  }
}
