/**
 * 검수 실패 글 재생성 모듈
 * - 미사용 SignalItem으로 AI 재생성
 * - 재검수 후 통과 시 signal 카테고리로 승격
 * - 실패 시 새 점수/이슈로 업데이트
 */

import OpenAI from "openai";
import { prisma } from "./prisma";
import { calculateReadingTime } from "./markdown";
import { getAIConfig } from "./claude";
import { getWritingStyle, buildSystemPrompt } from "@/config/writing-style";
import { validatePost, buildFailureBanner } from "./post-validator";

const SIGNAL_RESPONSE_FORMAT = `반드시 JSON으로 응답:
{
  "title": "AI 업데이트: 핵심 키워드 요약",
  "content": "마크다운 본문",
  "titleEn": "English title",
  "contentEn": "English markdown body",
  "tags": ["태그1", "태그2", "태그3"]
}`;

export interface RegenerateResult {
  postId: string;
  upgraded: boolean;
  previousScore: number | null;
  newScore: number;
  newCategory: string;
  issues: { severity: string; code: string; message: string }[];
}

export const regeneratePost = async (postId: string): Promise<RegenerateResult> => {
  // 1. 기존 글 조회
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  // 2. 미사용 SignalItem 조회 (48h → 7일로 확장, 재생성이므로 여유 있게)
  const freshItems = await prisma.signalItem.findMany({
    where: {
      usedInPost: null,
      fetchedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { score: "desc" },
    take: 15,
  });

  if (freshItems.length < 2) {
    throw new Error(`재생성할 소스가 부족합니다 (${freshItems.length}건, 최소 2건 필요)`);
  }

  // 3. AI 재생성
  const { baseURL, apiKey, model } = await getAIConfig();
  const client = new OpenAI({ apiKey, baseURL });

  const style = await getWritingStyle("signal");
  const systemPrompt = buildSystemPrompt(style, SIGNAL_RESPONSE_FORMAT, model);

  const newsContext = freshItems
    .map((n, i) => `${i + 1}. [${n.source}] ${n.title}\n   URL: ${n.url}\n   Score: ${n.score}${n.summary ? `\n   Summary: ${n.summary.slice(0, 200)}` : ""}`)
    .join("\n\n");

  const response = await client.chat.completions.create({
    model,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `오늘 수집된 AI 관련 뉴스입니다 (${freshItems.length}건, 다양한 소스). 이를 바탕으로 Daily AI 업데이트 글을 작성해주세요.\n\n${newsContext}\n\nJSON으로 응답해.`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  let jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // 재시도
    const retry = await client.chat.completions.create({
      model,
      max_tokens: 6000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "아래 텍스트를 JSON 형식으로 변환하라. 다른 설명 없이 JSON만 출력하라." },
        { role: "user", content: `다음 글을 이 JSON 형식으로 변환해:\n${SIGNAL_RESPONSE_FORMAT}\n\n---\n\n${text}` },
      ],
    });
    const retryText = retry.choices[0]?.message?.content ?? "";
    jsonMatch = retryText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI 응답을 JSON으로 파싱할 수 없습니다");
    }
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const usage = response.usage;
  const tokenBadge = usage
    ? `> 🤖 \`${usage.prompt_tokens} in / ${usage.completion_tokens} out / ${usage.total_tokens} total tokens\`\n\n`
    : "";

  const content = tokenBadge + parsed.content;
  const contentEn = parsed.contentEn ? tokenBadge + parsed.contentEn : null;

  // 4. 재검수
  const validation = await validatePost({
    content,
    title: parsed.title,
    minLength: 800,
    maxLength: 8000,
    requireSources: true,
    checkHallucination: true,
    sourceContext: newsContext,
  });

  const finalContent = validation.passed ? content : buildFailureBanner(validation) + content;
  const finalContentEn = validation.passed ? contentEn : (contentEn ? buildFailureBanner(validation) + contentEn : contentEn);
  const newCategory = validation.passed ? "signal" : "hallucination";

  const readingTime = calculateReadingTime(content);
  const excerpt = content.replace(/[#*`>\[\]]/g, "").slice(0, 200);
  const excerptEn = contentEn ? contentEn.replace(/[#*`>\[\]]/g, "").slice(0, 200) : null;

  // 5. 글 업데이트
  await prisma.post.update({
    where: { id: postId },
    data: {
      title: parsed.title,
      titleEn: parsed.titleEn || null,
      content: finalContent,
      contentEn: finalContentEn,
      excerpt,
      excerptEn,
      category: newCategory,
      tags: validation.passed ? (parsed.tags || ["AI", "Daily"]) : [...(parsed.tags || ["AI", "Daily"]), "검수실패"],
      readingTime,
      validationScore: validation.score,
      validationIssues: validation.issues.length > 0 ? JSON.stringify(validation.issues) : null,
      validatedAt: new Date(),
    },
  });

  // 6. 검수 통과 시 SignalItem 소비 처리
  if (validation.passed) {
    await prisma.signalItem.updateMany({
      where: { id: { in: freshItems.map((i) => i.id) } },
      data: { usedInPost: postId },
    });
  }

  console.log(`[Regenerate] post=${postId} ${post.validationScore}→${validation.score} category=${newCategory}`);

  return {
    postId,
    upgraded: validation.passed,
    previousScore: post.validationScore,
    newScore: validation.score,
    newCategory,
    issues: validation.issues,
  };
};
