import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!session || !user?.isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    // 기간 내 총 조회수
    const totalResult = await prisma.analytics.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { views: true },
    });
    const totalViews = totalResult._sum.views || 0;

    // 글별 조회수 Top 10
    const topPostsRaw = await prisma.analytics.groupBy({
      by: ["postId"],
      where: { createdAt: { gte: since } },
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: 10,
    });

    const postIds = topPostsRaw.map((p) => p.postId);
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, title: true, slug: true, category: true },
    });

    const topPosts = topPostsRaw.map((p) => {
      const post = posts.find((pp) => pp.id === p.postId);
      return {
        id: p.postId,
        title: post?.title || "Unknown",
        slug: post?.slug || "",
        category: post?.category || "",
        views: p._sum.views || 0,
      };
    });

    // 일별 조회수
    const dailyRaw = await prisma.$queryRaw<{ date: string; views: bigint }[]>`
      SELECT DATE("createdAt") as date, SUM(views)::bigint as views
      FROM "Analytics"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const daily = dailyRaw.map((d) => ({
      date: new Date(d.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      views: Number(d.views),
    }));

    // 카테고리별 조회수
    const categoryRaw = await prisma.$queryRaw<{ category: string; views: bigint }[]>`
      SELECT p.category, SUM(a.views)::bigint as views
      FROM "Analytics" a
      JOIN "Post" p ON a."postId" = p.id
      WHERE a."createdAt" >= ${since}
      GROUP BY p.category
      ORDER BY views DESC
    `;

    const byCategory = categoryRaw.map((c) => ({
      category: c.category,
      views: Number(c.views),
    }));

    return NextResponse.json({
      success: true,
      data: { totalViews, topPosts, daily, byCategory },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Analytics query failed",
      data: { totalViews: 0, topPosts: [], daily: [], byCategory: [] },
    });
  }
};
