import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/types";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

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
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "content is required" },
        { status: 400 }
      );
    }

    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);

    return NextResponse.json<ApiResponse>({ success: true, data: String(result) });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : "Failed to render preview" },
      { status: 500 }
    );
  }
};
