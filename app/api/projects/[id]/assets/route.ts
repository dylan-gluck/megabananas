import { jsonSuccess, serverError } from "@/lib/api/response";
import type { AssetType } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as AssetType | null;

    const assets = await prisma.asset.findMany({
      where: {
        projectId: id,
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonSuccess({ assets });
  } catch (error) {
    return serverError(error, "Error fetching project assets");
  }
}
