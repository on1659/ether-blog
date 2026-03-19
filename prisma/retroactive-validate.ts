/**
 * 기존 signal/commits 글 소급 검수
 * 링크 깨진 글, 품질 미달 글 → hallucination 카테고리로 이동
 *
 * 실행: npx tsx prisma/retroactive-validate.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MARKDOWN_LINK_RE_FACTORY = () => /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;

const extractLinks = (markdown: string): string[] => {
  const re = MARKDOWN_LINK_RE_FACTORY();
  const urls: string[] = [];
  let match;
  while ((match = re.exec(markdown)) !== null) {
    urls.push(match[2]);
  }
  return [...new Set(urls)];
};

const checkUrl = async (url: string): Promise<{ ok: boolean; status?: number; error?: string }> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "EtherBlog-Validator/1.0" },
    });
    clearTimeout(timeout);

    if (res.status === 403 || res.status === 405) {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 10000);
      const res2 = await fetch(url, {
        method: "GET",
        signal: c2.signal,
        redirect: "follow",
        headers: { "User-Agent": "EtherBlog-Validator/1.0" },
      });
      clearTimeout(t2);
      await res2.body?.cancel();
      return { ok: res2.status < 400, status: res2.status };
    }

    await res.body?.cancel();
    return { ok: res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown" };
  }
};

const main = async () => {
  // 모든 published signal 글 조회
  const posts = await prisma.post.findMany({
    where: { published: true, category: "signal" },
    select: { id: true, title: true, content: true, slug: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\n📋 검수 대상: ${posts.length}건 (signal, published)\n`);

  let failCount = 0;
  const CONCURRENCY = 3;

  for (const post of posts) {
    const urls = extractLinks(post.content);
    if (urls.length === 0) {
      console.log(`⏭️  [${post.slug}] "${post.title}" — 링크 없음, 스킵`);
      continue;
    }

    // URL 검사 (최대 15개)
    const toCheck = urls.slice(0, 15);
    const deadLinks: { url: string; reason: string }[] = [];

    for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
      const batch = toCheck.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (url) => {
          const result = await checkUrl(url);
          return { url, ...result };
        })
      );
      for (const r of results) {
        if (!r.ok) {
          deadLinks.push({ url: r.url, reason: `${r.status ?? r.error}` });
        }
      }
    }

    const deadRatio = deadLinks.length / toCheck.length;

    if (deadLinks.length > 0) {
      const issues = deadLinks.map((d) => ({
        severity: "error",
        code: "DEAD_LINK",
        message: `${d.url} (${d.reason})`,
      }));

      // 죽은 링크가 30% 이상이면 hallucination으로 이동
      if (deadRatio >= 0.3) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            category: "hallucination",
            published: false,
            tags: { push: "검수실패" },
            validationScore: Math.max(0, 100 - deadLinks.length * 20),
            validationIssues: JSON.stringify(issues),
            validatedAt: new Date(),
          },
        });
        failCount++;
        console.log(`❌ [${post.slug}] "${post.title}" → hallucination (${deadLinks.length}/${toCheck.length} dead)`);
        for (const d of deadLinks) {
          console.log(`   🔗 ${d.url} — ${d.reason}`);
        }
      } else {
        // 30% 미만이면 warning만 기록
        await prisma.post.update({
          where: { id: post.id },
          data: {
            validationScore: Math.max(0, 100 - deadLinks.length * 20),
            validationIssues: JSON.stringify(issues),
            validatedAt: new Date(),
          },
        });
        console.log(`⚠️  [${post.slug}] "${post.title}" — ${deadLinks.length}/${toCheck.length} dead (30% 미만, 유지)`);
      }
    } else {
      // 검수 통과
      await prisma.post.update({
        where: { id: post.id },
        data: {
          validationScore: 100,
          validationIssues: null,
          validatedAt: new Date(),
        },
      });
      console.log(`✅ [${post.slug}] "${post.title}" — ${toCheck.length}개 링크 모두 정상`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 결과: ${posts.length}건 검수, ${failCount}건 hallucination 이동`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await prisma.$disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
