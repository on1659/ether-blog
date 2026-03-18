import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { prisma } from "./prisma";
import { calculateReadingTime } from "./markdown";
import { fetchAINews } from "./fetch-ai-news";
import { getAIConfig } from "./claude";
import { type RawSignalItem, SLOT_CONFIG, TOTAL_SLOTS } from "./signal-sources";

const DAILY_AI_PROMPT = `당신은 "이더"라는 개발자의 기술 블로그에서 AI 뉴스 다이제스트를 작성하는 역할입니다.
다양한 소스(Hacker News, Reddit, HuggingFace Papers, GitHub Trending, RSS)에서 수집된 AI 관련 뉴스를 바탕으로 하나의 블로그 글을 작성합니다.

## 문체 규칙

- "~다" 체. 친구한테 설명하듯이 자연스럽게.
- 뉴스 나열이 아니라, 개발자 관점에서 해석과 코멘트를 곁들인다.
- 각 뉴스에 대해 "이게 왜 중요한지" 한줄 코멘트를 추가한다.

## 구조

- 제목은 "AI 업데이트: {핵심 키워드}" 형식
- 본문은 ## 섹션으로 구분 (예: 🔥 핫 토픽, 📰 뉴스, 📄 논문, ⭐ 오픈소스 등)
- 섹션마다 뉴스 제목 + 원문 링크 + 2~3문장 해설
- 각 항목 말미에 **출처:** [소스명](원문URL) 형태로 출처를 반드시 명시
- 소스가 다양하면 섹션을 소스 유형별로 묶어도 좋다
- 마지막에 > 인용구로 오늘의 한줄 정리
- 전체 2000~4000자

## 금지

- 단순 번역이나 복붙
- "~하겠습니다" 같은 존댓말
- 이모지 남용

## 응답 형식

반드시 JSON으로 응답:
{
  "title": "AI 업데이트: 핵심 키워드 요약",
  "content": "마크다운 본문",
  "titleEn": "English title",
  "contentEn": "English markdown body",
  "tags": ["태그1", "태그2", "태그3"]
}`;

const HOURLY_CAP = 6;

export const generateDailyAIPost = async (): Promise<{
  postId: string | null;
  skipped: boolean;
  reason?: string;
}> => {
  // 1시간 내 이미 생성된 signal 글이 있으면 스킵
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.post.count({
    where: { category: "signal", createdAt: { gte: oneHourAgo } },
  });

  if (recentCount >= HOURLY_CAP) {
    return { postId: null, skipped: true, reason: `Hourly cap reached (${recentCount}/${HOURLY_CAP})` };
  }

  // 소스 수집 + dedup + 슬롯제 선별
  const news = await fetchAINews();

  if (news.length === 0) {
    return { postId: null, skipped: true, reason: "No AI news found from any source" };
  }

  // SignalItem 테이블에 upsert (externalId 기반 중복 차단)
  await upsertSignalItems(news);

  // 미사용 아이템만 조회 (48h 이내, usedInPost=null)
  const freshItems = await prisma.signalItem.findMany({
    where: {
      usedInPost: null,
      fetchedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    orderBy: { score: "desc" },
    take: 30,
  });

  if (freshItems.length < 2) {
    return { postId: null, skipped: true, reason: `Only ${freshItems.length} fresh items (need at least 2)` };
  }

  // 슬롯제 재적용 (DB에서 가져온 fresh items 기준)
  const topItems = selectFreshBySlots(freshItems);

  // AI로 글 생성
  const { baseURL, apiKey, model } = await getAIConfig();
  const client = new OpenAI({ apiKey, baseURL });

  const newsContext = topItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   URL: ${n.url}\n   Score: ${n.score}${n.summary ? `\n   Summary: ${n.summary.slice(0, 200)}` : ""}`)
    .join("\n\n");

  const response = await client.chat.completions.create({
    model,
    max_tokens: 6000,
    messages: [
      { role: "system", content: DAILY_AI_PROMPT },
      {
        role: "user",
        content: `오늘 수집된 AI 관련 뉴스입니다 (${topItems.length}건, 다양한 소스). 이를 바탕으로 Daily AI 업데이트 글을 작성해주세요.\n\n${newsContext}\n\nJSON으로 응답해.`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const usage = response.usage;
  const tokenBadge = usage
    ? `> 🤖 \`${usage.prompt_tokens} in / ${usage.completion_tokens} out / ${usage.total_tokens} total tokens\`\n\n`
    : "";

  const content = tokenBadge + parsed.content;
  const contentEn = parsed.contentEn ? tokenBadge + parsed.contentEn : null;

  // DB 저장 (slug = cuid 기반, 경합 불가)
  const slug = `signal-${crypto.randomUUID().slice(0, 12)}`;
  const readingTime = calculateReadingTime(content);
  const excerpt = content.replace(/[#*`>\[\]]/g, "").slice(0, 200);
  const excerptEn = contentEn ? contentEn.replace(/[#*`>\[\]]/g, "").slice(0, 200) : null;

  const post = await prisma.post.create({
    data: {
      title: parsed.title,
      titleEn: parsed.titleEn || null,
      content,
      contentEn,
      excerpt,
      excerptEn,
      slug,
      category: "signal",
      tags: parsed.tags || ["AI", "Daily"],
      readingTime,
      published: true,
    },
  });

  // 썸네일 설정
  await prisma.post.update({
    where: { id: post.id },
    data: { coverImage: `/api/thumbnail/${post.id}` },
  });

  // 사용된 SignalItem에 postId 기록
  await prisma.signalItem.updateMany({
    where: { id: { in: topItems.map((i) => i.id) } },
    data: { usedInPost: post.id },
  });

  // ISR 캐시 갱신
  try {
    revalidatePath("/");
    revalidatePath("/signal");
  } catch {
    console.error("Revalidation failed");
  }

  const sourceSummary = [...new Set(topItems.map((n) => n.source.split(" ")[0]))].join(", ");
  console.log(`Generated daily AI post: ${post.id} (${topItems.length} items, sources: ${sourceSummary})`);

  return { postId: post.id, skipped: false };
};

/* ───── SignalItem upsert ───── */

const upsertSignalItems = async (items: RawSignalItem[]) => {
  for (const item of items) {
    try {
      await prisma.signalItem.upsert({
        where: { externalId: item.externalId },
        create: {
          externalId: item.externalId,
          canonicalUrl: item.canonicalUrl,
          source: item.source,
          sourceType: item.sourceType,
          title: item.title,
          url: item.url,
          score: item.score,
          summary: item.summary,
          fetchedAt: new Date(),
        },
        update: {
          score: item.score,
        },
      });
    } catch (e) {
      // unique constraint 충돌 등 개별 실패는 무시
      console.error(`SignalItem upsert failed for ${item.externalId}:`, e);
    }
  }
};

/* ───── DB fresh items → 슬롯제 선별 ───── */

interface SignalItemRow {
  id: string;
  source: string;
  sourceType: string;
  title: string;
  url: string;
  score: number;
  summary: string | null;
}

const selectFreshBySlots = (items: SignalItemRow[]): SignalItemRow[] => {
  const slots = SLOT_CONFIG;
  const byType: Record<string, SignalItemRow[]> = { community: [], research: [], industry: [] };

  for (const item of items) {
    byType[item.sourceType]?.push(item);
  }

  const selected: SignalItemRow[] = [];
  const remaining: SignalItemRow[] = [];

  for (const type of ["community", "research", "industry"] as const) {
    const slot = slots[type];
    const pool = byType[type] ?? [];
    selected.push(...pool.slice(0, slot));
    remaining.push(...pool.slice(slot));
  }

  // 부족분 채우기
  if (selected.length < TOTAL_SLOTS) {
    remaining.sort((a, b) => b.score - a.score);
    selected.push(...remaining.slice(0, TOTAL_SLOTS - selected.length));
  }

  return selected;
};
