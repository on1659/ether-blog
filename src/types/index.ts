export type Category = "commits" | "articles" | "casual" | "signal" | "hallucination";

/**
 * 카테고리 비트플래그 — "전체" 필터에 포함할 카테고리를 int 1개로 관리
 * bit 0 = commits (1), bit 1 = articles (2), bit 2 = casual (4),
 * bit 3 = signal (8), bit 4 = hallucination (16)
 */
export const CATEGORY_BITS: Record<Category, number> = {
  commits: 1,
  articles: 2,
  casual: 4,
  signal: 8,
  hallucination: 16,
};

/** 비트플래그 → 포함된 카테고리 배열 */
export const flagsToCategories = (flags: number): Category[] =>
  (Object.entries(CATEGORY_BITS) as [Category, number][])
    .filter(([, bit]) => flags & bit)
    .map(([cat]) => cat);

/** 카테고리 배열 → 비트플래그 */
export const categoriesToFlags = (cats: Category[]): number =>
  cats.reduce((acc, cat) => acc | (CATEGORY_BITS[cat] ?? 0), 0);

/** 기본값: articles + signal (commits, hallucination 제외) */
export const DEFAULT_HOME_FLAGS = 2 | 4 | 8; // articles + casual + signal = 14

export interface PostMeta {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  excerpt?: string;
  excerptEn?: string;
  category: Category;
  coverImage?: string;
  tags: string[];
  readingTime: number;
  createdAt: string;
  published: boolean;
  featured: boolean;
  commitHash?: string;
  commitUrl?: string;
  repoName?: string;
  filesChanged?: number;
  hasEnglish?: boolean;
  viewCount?: number;
}

export interface PostDetail extends PostMeta {
  content: string;
  contentEn?: string;
  seriesId?: string;
  seriesOrder?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
