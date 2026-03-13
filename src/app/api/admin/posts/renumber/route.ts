import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

export const POST = async () => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    });

    let updated = 0;
    for (let i = 0; i < posts.length; i++) {
      const newSlug = String(i + 1);
      if (posts[i].slug !== newSlug) {
        await prisma.post.update({
          where: { id: posts[i].id },
          data: { slug: newSlug },
        });
        updated++;
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { total: posts.length, updated },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to renumber" },
      { status: 500 }
    );
  }
};
