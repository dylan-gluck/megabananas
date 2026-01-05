import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import {
  badRequest,
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { ensureDirectoryExists, saveBase64Image } from "@/lib/file-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { image, filename: originalFilename } = body;

    if (!image) {
      return badRequest("image (base64) is required");
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return notFound("Project");
    }

    // Create references directory
    const refsDir = path.join(
      process.cwd(),
      "public",
      "assets",
      projectId,
      "references",
    );
    ensureDirectoryExists(refsDir);

    // Generate filename
    const timestamp = Date.now();
    const ext = originalFilename?.split(".").pop() || "png";
    const filename = `ref_${timestamp}.${ext}`;

    // Decode and save
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    saveBase64Image(base64Data, refsDir, filename);

    const filePath = `/assets/${projectId}/references/${filename}`;

    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        projectId,
        filePath,
        type: "reference",
      },
    });

    return jsonSuccess(asset);
  } catch (error) {
    return serverError(error, "upload reference error");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return badRequest("assetId query param required");
    }

    // Verify asset exists and belongs to project
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, projectId, type: "reference" },
    });

    if (!asset) {
      return notFound("Asset");
    }

    // Delete file from disk
    const filepath = path.join(process.cwd(), "public", asset.filePath);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    await prisma.asset.delete({ where: { id: assetId } });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "delete reference error");
  }
}
