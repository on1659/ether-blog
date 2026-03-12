import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import type { ApiResponse } from "@/types";

export const POST = async (req: NextRequest) => {
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated) return authResult.response!;

  try {
    const body = await req.json().catch(() => ({}));
    const category = body.category || null;

    // coverImage가 없는 글에 URL 세팅
    const where: Record<string, unknown> = { coverImage: null };
    if (category) where.category = category;

    const posts = await prisma.post.findMany({
      where,
      select: { id: true, slug: true, title: true },
    });

    if (posts.length === 0) {
      const res: ApiResponse = {
        success: true,
        data: { updated: 0, message: "All posts already have thumbnails" },
      };
      return NextResponse.json(res);
    }

    // 각 글에 thumbnail API URL 세팅
    const ids = posts.map((p) => p.id);
    await prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { coverImage: "__BATCH__" },
    });

    // 개별 URL로 업데이트
    for (const post of posts) {
      await prisma.post.update({
        where: { id: post.id },
        data: { coverImage: `/api/thumbnail/${post.id}` },
      });
    }

    const res: ApiResponse = {
      success: true,
      data: {
        updated: posts.length,
        posts: posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title })),
      },
    };
    return NextResponse.json(res);
  } catch (error) {
    const res: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
    return NextResponse.json(res, { status: 500 });
  }
};
