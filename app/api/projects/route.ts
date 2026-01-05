import {
  badRequest,
  jsonCreated,
  jsonSuccess,
  serverError,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            characters: true,
            animations: true,
          },
        },
      },
    });

    return jsonSuccess(projects);
  } catch (error) {
    return serverError(error, "Error fetching projects");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return badRequest("Project name is required");
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
      },
    });

    return jsonCreated(project);
  } catch (error) {
    return serverError(error, "Error creating project");
  }
}
