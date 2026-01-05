import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import {
  badRequest,
  jsonSuccess,
  serverError,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const VALID_FOLDERS = ["characters", "sprites", "reference"];

// GET - List assets from filesystem (legacy)
export async function GET(request: NextRequest) {
  const folder = request.nextUrl.searchParams.get("folder");

  if (!folder || !VALID_FOLDERS.includes(folder)) {
    return badRequest("Invalid folder. Must be: characters, sprites, or reference");
  }

  try {
    const assetsPath = path.join(process.cwd(), "public", "assets", folder);

    if (!fs.existsSync(assetsPath)) {
      return jsonSuccess({ assets: [] });
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

    return jsonSuccess({ assets: imageFiles });
  } catch (error) {
    return serverError(error, "assets error");
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
      return badRequest("projectId and filePath are required");
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

    return jsonSuccess(asset);
  } catch (error) {
    return serverError(error, "create asset error");
  }
}
