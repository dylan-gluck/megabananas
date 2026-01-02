import fs from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_FOLDERS = ["characters", "sprites", "reference"];

// GET - List assets from filesystem (legacy)
export async function GET(request: NextRequest) {
  const folder = request.nextUrl.searchParams.get("folder");

  if (!folder || !VALID_FOLDERS.includes(folder)) {
    return NextResponse.json(
      { error: "Invalid folder. Must be: characters, sprites, or reference" },
      { status: 400 },
    );
  }

  try {
    const assetsPath = path.join(process.cwd(), "public", "assets", folder);

    if (!fs.existsSync(assetsPath)) {
      return NextResponse.json({ assets: [] });
    }

    const files = fs.readdirSync(assetsPath);
    const imageFiles = files
      .filter((f) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
      .map((filename) => {
        const filepath = path.join(assetsPath, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          url: `/assets/${folder}/${filename}`,
          createdAt: stats.birthtime.toISOString(),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json({ assets: imageFiles });
  } catch (error) {
    console.error("assets error:", error);
    return NextResponse.json(
      { error: "Failed to list assets" },
      { status: 500 },
    );
  }
}

// POST - Create asset record in DB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      filePath,
      systemPrompt,
      userPrompt,
      referenceAssetIds,
      generationSettings,
      characterId,
    } = body;

    if (!projectId || !filePath) {
      return NextResponse.json(
        { error: "projectId and filePath are required" },
        { status: 400 },
      );
    }

    const asset = await prisma.asset.create({
      data: {
        projectId,
        filePath,
        systemPrompt: systemPrompt || null,
        userPrompt: userPrompt || null,
        referenceAssetIds: referenceAssetIds || [],
        generationSettings: generationSettings || null,
        characterId: characterId || null,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("create asset error:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 },
    );
  }
}
