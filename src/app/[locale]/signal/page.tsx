export const revalidate = 3600;

import { prisma } from "@/lib/prisma";
import { PostList } from "@/components/post/PostList";
import { Pagination } from "@/components/home/Pagination";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Signal" };

const PAGE_SIZE = 10;

const SignalPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string; page?: string }>;
}) => {
  const sp = await searchParams;
  const currentSub = sp.sub || "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const subcat = siteConfig.signalSubcategories.find((s) => s.key === currentSub);
  const filterTags = subcat && subcat.tags.length > 0 ? subcat.tags : null;

  const where: Record<string, unknown> = { published: true, category: "signal" as const };
  if (filterTags) {
    where.tags = { hasSome: filterTags };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, slug: true, title: true, subtitle: true, excerpt: true,
        category: true, coverImage: true, tags: true, readingTime: true,
        createdAt: true, published: true, featured: true,
        commitHash: true, commitUrl: true, repoName: true, filesChanged: true, viewCount: true,
      },
    }).catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const mapped = posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    subtitle: p.subtitle ?? undefined,
    excerpt: p.excerpt ?? undefined,
    coverImage: p.coverImage ?? undefined,
    commitHash: p.commitHash ?? undefined,
    commitUrl: p.commitUrl ?? undefined,
    repoName: p.repoName ?? undefined,
    filesChanged: p.filesChanged ?? undefined,
  }));

  return (
    <div>
      <div className="mx-auto max-w-container px-5 sm:px-8 pt-12">
        <h1 className="text-section-title">AI Signal</h1>
        <p className="mt-2 text-card-desc text-text-secondary">
          AI 관련 최신 뉴스와 시그널
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {siteConfig.signalSubcategories.map((sub) => (
            <Link
              key={sub.key}
              href={sub.key === "all" ? "/signal" : `/signal?sub=${sub.key}`}
              className={`rounded-full border px-4 py-1.5 text-[0.8125rem] font-medium transition-all duration-base ${
                currentSub === sub.key
                  ? "border-cat-signal bg-cat-signal text-white"
                  : "border-border text-text-tertiary hover:border-cat-signal hover:text-cat-signal"
              }`}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      </div>

      <PostList posts={mapped} />

      {totalPages > 1 && (
        <div className="mx-auto max-w-container px-5 sm:px-8 pb-16">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            extraParams={currentSub !== "all" ? { sub: currentSub } : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default SignalPage;
