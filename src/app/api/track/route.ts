import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  try {
    const { postId, referrer, userAgent } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await prisma.analytics.create({
      data: {
        postId,
        referrer: referrer || null,
        userAgent: userAgent?.slice(0, 255) || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
};
