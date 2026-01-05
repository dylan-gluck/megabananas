import type { NextRequest } from "next/server";
import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

// GET - Fetch single asset by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return notFound("Asset");
    }

    return jsonSuccess(asset);
  } catch (error) {
    return serverError(error, "fetch asset error");
  }
}

// DELETE - Delete asset by ID
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.asset.delete({
      where: { id },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "delete asset error");
  }
}
