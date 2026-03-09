export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryFilter } from "@/components/home/CategoryFilter";
import { PostList } from "@/components/post/PostList";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/types";

const getPosts = async (category?: string) => {
  try {
    const where: Record<string, unknown> = { published: true };
    if (category && category !== "all") {
      where.category = category as Category;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        category: true,
        coverImage: true,
        tags: true,
        readingTime: true,
        createdAt: true,
        published: true,
        featured: true,
        commitHash: true,
        commitUrl: true,
        repoName: true,
        filesChanged: true,
      },
    });

    return posts.map((p) => ({
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
  } catch {
    return [];
  }
};

const Home = async ({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) => {
  const params = await searchParams;
  const posts = await getPosts(params.category);

  return (
    <>
      <HeroBanner />

      {/* Section Header */}
      <div className="mx-auto flex max-w-container items-center justify-between px-8 pt-12">
        <h2 className="text-[1.375rem] font-bold tracking-[-0.02em]">
          최근 게시물
        </h2>
        <Link
          href="/articles"
          className="text-sm font-medium text-text-tertiary transition-colors duration-base hover:text-brand-primary"
        >
          전체보기 →
        </Link>
      </div>

      <Suspense>
        <CategoryFilter />
      </Suspense>

      <PostList posts={posts} />
    </>
  );
};

export default Home;
