import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		const assets = await prisma.asset.findMany({
			where: { projectId: id },
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({ assets });
	} catch (error) {
		console.error("Error fetching project assets:", error);
		return NextResponse.json(
			{ error: "Failed to fetch assets" },
			{ status: 500 }
		);
	}
}
