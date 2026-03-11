import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.dailyAnalytics.upsert({
        where: { postId_date: { postId, date: today } },
        update: { views: { increment: 1 } },
        create: { postId, date: today, views: 1 },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
};
