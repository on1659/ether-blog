import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PUT = async (req: NextRequest, { params }: RouteParams) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const post = await prisma.post.update({
      where: { id },
      data: body,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: post });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to update post" },
      { status: 500 }
    );
  }
};

export const DELETE = async (_req: NextRequest, { params }: RouteParams) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.post.delete({ where: { id } });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete post" },
      { status: 500 }
    );
  }
};
