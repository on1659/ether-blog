import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, nextSlug } from "@/lib/prisma";
import { calculateReadingTime } from "@/lib/markdown";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

export const POST = async (req: NextRequest) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title, subtitle, content, category,
      tags = [], published = false,
      titleEn, contentEn, slug: customSlug,
      contentType = "markdown",
    } = body;

    if (!title || !content || !category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "title, content, and category are required" },
        { status: 400 }
      );
    }

    const slug = customSlug || await nextSlug();

    // 중복 slug 체크
    if (customSlug) {
      const existing = await prisma.post.findUnique({ where: { slug: customSlug } });
      if (existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `slug "${customSlug}" already exists` },
          { status: 400 }
        );
      }
    }

    const readingTime = calculateReadingTime(
      contentType === "html"
        ? content.replace(/<[^>]*>/g, "")
        : content
    );
    const excerpt = contentType === "html"
      ? content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 200)
      : content.replace(/[#*`>\[\]]/g, "").slice(0, 200);
    const excerptEn = contentEn
      ? contentEn.replace(/[#*`>\[\]]/g, "").slice(0, 200)
      : undefined;

    const post = await prisma.post.create({
      data: {
        title,
        subtitle: subtitle || undefined,
        content,
        contentType,
        excerpt,
        category,
        tags,
        slug,
        published,
        readingTime,
        coverImage: "",
        ...(titleEn ? { titleEn } : {}),
        ...(contentEn ? { contentEn, excerptEn } : {}),
      },
    });

    // 텍스트 기반 썸네일 자동 생성
    await prisma.post.update({
      where: { id: post.id },
      data: { coverImage: `/api/thumbnail/${post.id}` },
    });

    if (published) {
      revalidatePath("/");
      revalidatePath(`/${category}`);
      revalidatePath(`/post/${slug}`);
    }

    return NextResponse.json<ApiResponse>({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
};
