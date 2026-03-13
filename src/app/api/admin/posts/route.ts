import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReadingTime } from "@/lib/markdown";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

const nextSlug = async (): Promise<string> => {
  const count = await prisma.post.count();
  return String(count + 1);
};

export const POST = async (req: NextRequest) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, category, tags = [], published = false } = body;

    if (!title || !content || !category) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "title, content, and category are required" },
        { status: 400 }
      );
    }

    const slug = await nextSlug();
    const readingTime = calculateReadingTime(content);
    const excerpt = content.replace(/[#*`>\[\]]/g, "").slice(0, 200);

    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt,
        category,
        tags,
        slug,
        published,
        readingTime,
        coverImage: "",
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
