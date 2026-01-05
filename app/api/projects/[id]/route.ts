import {
  jsonSuccess,
  notFound,
  serverError,
} from "@/lib/api/response";
import { projectWithRelations } from "@/lib/db/includes";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: projectWithRelations,
    });

    if (!project) {
      return notFound("Project");
    }

    return jsonSuccess(project);
  } catch (error) {
    return serverError(error, "Error fetching project");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, thumbnailId } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(thumbnailId !== undefined && { thumbnailId }),
      },
    });

    return jsonSuccess(project);
  } catch (error) {
    return serverError(error, "Error updating project");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    return serverError(error, "Error deleting project");
  }
}
