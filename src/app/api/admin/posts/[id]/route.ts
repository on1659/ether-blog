import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReadingTime } from "@/lib/markdown";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = async (_req: NextRequest, { params }: RouteParams) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json<ApiResponse>({ success: true, data: post });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch post" },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest, { params }: RouteParams) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Recalculate reading time and excerpt when content changes
    if (body.content) {
      body.readingTime = calculateReadingTime(body.content);
      body.excerpt = body.content.replace(/[#*`>\[\]]/g, "").slice(0, 200);
    }
    if (body.contentEn) {
      body.excerptEn = body.contentEn.replace(/[#*`>\[\]]/g, "").slice(0, 200);
    }

    // Bust thumbnail cache when category changes (dynamic thumbnails use category colors)
    if (body.category) {
      const existing = await prisma.post.findUnique({
        where: { id },
        select: { category: true, coverImage: true },
      });
      if (
        existing &&
        existing.category !== body.category &&
        existing.coverImage?.startsWith("/api/thumbnail/")
      ) {
        body.coverImage = `/api/thumbnail/${id}?v=${Date.now()}`;
      }
    }

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
