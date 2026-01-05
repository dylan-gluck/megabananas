import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { characterWithDetails, characterWithPrimaryAsset } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: characterWithDetails,
    });

    if (!character) {
      return notFound("Character");
    }

    return jsonSuccess(character);
  } catch (error) {
    return serverError(error, "Error fetching character");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, userPrompt, primaryAssetId } = body;

    const character = await prisma.character.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(userPrompt !== undefined && { userPrompt }),
        ...(primaryAssetId !== undefined && { primaryAssetId }),
      },
      include: characterWithPrimaryAsset,
    });

    return jsonSuccess(character);
  } catch (error) {
    return serverError(error, "Error updating character");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.character.delete({
      where: { id },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error deleting character");
  }
}
