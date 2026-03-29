import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { regeneratePost } from "@/lib/regenerate-post";
import type { ApiResponse } from "@/types";

const requireAdmin = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  return session && user?.isAdmin;
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const maxDuration = 300;

/**
 * POST /api/admin/posts/[id]/regenerate
 * 검수 실패(hallucination) 글을 AI로 재생성 + 재검수
 * 통과 시 signal 카테고리로 승격
 */
export const POST = async (_req: NextRequest, { params }: RouteParams) => {
  if (!(await requireAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await regeneratePost(id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    }, { status: result.upgraded ? 200 : 200 });
  } catch (error) {
    console.error("[Regenerate] Failed:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to regenerate post" },
      { status: 500 }
    );
  }
};
