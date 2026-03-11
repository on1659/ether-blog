import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import { calculateReadingTime } from "@/lib/markdown";
import type { ApiResponse } from "@/types";

const toSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const published = searchParams.get("published");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (published === "true") where.published = true;
    if (published === "false") where.published = false;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, slug: true, title: true, subtitle: true, excerpt: true,
          category: true, coverImage: true, tags: true, readingTime: true,
          createdAt: true, published: true, featured: true,
          commitHash: true, commitUrl: true, repoName: true, filesChanged: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    const mapped = posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    }));

    const body: ApiResponse = {
      success: true,
      data: mapped,
    };
    return NextResponse.json({
      ...body,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const body: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
    return NextResponse.json(body, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated) return authResult.response!;

  try {
    const body = await req.json();
    const {
      title,
      content,
      category,
      tags = [],
      coverImage,
      slug,
      published = false,
      subtitle,
      excerpt,
      projectSlug,
      commitHash,
      commitUrl,
      repoName,
      filesChanged,
    } = body;

    if (!title || !content || !category) {
      const res: ApiResponse = {
        success: false,
        error: "title, content, and category are required",
      };
      return NextResponse.json(res, { status: 400 });
    }

    const finalSlug = slug || toSlug(title);
    const readingTime = calculateReadingTime(content);
    const finalExcerpt = excerpt || content.replace(/[#*`>\[\]]/g, "").slice(0, 200);

    const post = await prisma.post.create({
      data: {
        title,
        subtitle,
        content,
        excerpt: finalExcerpt,
        category,
        tags,
        coverImage,
        slug: finalSlug,
        published,
        readingTime,
        projectSlug,
        commitHash,
        commitUrl,
        repoName,
        filesChanged,
      },
    });

    // published로 생성 시 ISR 캐시 즉시 갱신
    if (published) {
      revalidatePath("/");
      revalidatePath(`/${category}`);
      revalidatePath(`/post/${finalSlug}`);
    }

    const res: ApiResponse = { success: true, data: post };
    return NextResponse.json(res, { status: 201 });
  } catch (error) {
    const res: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
    return NextResponse.json(res, { status: 500 });
  }
};
