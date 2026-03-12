import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baiduspider/i,
  /duckduckbot/i, /facebookexternalhit/i, /twitterbot/i,
  /linkedinbot/i, /whatsapp/i, /telegrambot/i, /discordbot/i,
  /applebot/i, /semrushbot/i, /ahrefsbot/i, /mj12bot/i,
  /dotbot/i, /petalbot/i, /bytespider/i, /gptbot/i,
  /claudebot/i, /anthropic/i, /chatgpt/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i,
  /lighthouse/i, /pagespeed/i, /gtmetrix/i,
  /wget/i, /curl/i, /httpie/i, /python-requests/i, /axios/i,
  /go-http-client/i, /java\//i, /okhttp/i,
];

const isBot = (ua: string): boolean => {
  if (!ua) return true;
  return BOT_PATTERNS.some((pattern) => pattern.test(ua));
};

export const POST = async (req: NextRequest) => {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || "";
    const bot = isBot(ua);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.dailyAnalytics.upsert({
        where: { postId_date: { postId, date: today } },
        update: bot
          ? { botViews: { increment: 1 } }
          : { views: { increment: 1 } },
        create: {
          postId,
          date: today,
          views: bot ? 0 : 1,
          botViews: bot ? 1 : 0,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: bot
          ? { botViewCount: { increment: 1 } }
          : { viewCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
};
