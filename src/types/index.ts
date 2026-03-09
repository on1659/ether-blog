export type Category = "commits" | "articles" | "techlab" | "casual";

export interface PostMeta {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
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
}

export interface PostDetail extends PostMeta {
  content: string;
  seriesId?: string;
  seriesOrder?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
