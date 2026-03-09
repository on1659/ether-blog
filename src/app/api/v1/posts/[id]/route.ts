import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PUT = async (req: NextRequest, { params }: RouteParams) => {
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated) return authResult.response!;

  try {
    const { id } = await params;
    const body = await req.json();

    const post = await prisma.post.update({
      where: { id },
      data: body,
    });

    const res: ApiResponse = { success: true, data: post };
    return NextResponse.json(res);
  } catch (error) {
    const res: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
    };
    return NextResponse.json(res, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest, { params }: RouteParams) => {
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated) return authResult.response!;

  try {
    const { id } = await params;

    await prisma.post.delete({ where: { id } });

    const res: ApiResponse = { success: true };
    return NextResponse.json(res);
  } catch (error) {
    const res: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
    return NextResponse.json(res, { status: 500 });
  }
};
