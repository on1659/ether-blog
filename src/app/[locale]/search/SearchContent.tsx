"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp, Tag } from "lucide-react";
import Fuse from "fuse.js";
import { PostItem } from "@/components/post/PostItem";
import type { PostMeta } from "@/types";

const RECENT_KEY = "radar-recent-searches";
const MAX_RECENT = 5;

const getRecentSearches = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch { return []; }
};

const saveRecentSearch = (query: string) => {
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const clearRecentSearches = () => {
  localStorage.removeItem(RECENT_KEY);
};

export const SearchContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const initialTag = searchParams.get("tag") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/v1/posts?published=true&limit=500");
        const data = await res.json();
        if (data.success) {
          setPosts(data.data);
          const tagCounts: Record<string, number> = {};
          for (const post of data.data as PostMeta[]) {
            for (const tag of post.tags) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          }
          const sorted = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));
          setPopularTags(sorted);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, []);

  const fuse = useMemo(
    () => new Fuse(posts, {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "excerpt", weight: 0.3 },
        { name: "tags", weight: 0.3 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
    }),
    [posts]
  );

  // Filter by tag first, then apply text search
  const filteredByTag = activeTag
    ? posts.filter((p) => p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : null;

  const results = useMemo(() => {
    if (query && activeTag) {
      // Both text + tag: search within tag-filtered posts
      const tagFuse = new Fuse(filteredByTag || [], {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "excerpt", weight: 0.3 },
          { name: "tags", weight: 0.3 },
        ],
        threshold: 0.3,
      });
      return tagFuse.search(query).map((r) => r.item);
    }
    if (query) {
      return fuse.search(query).map((r) => r.item);
    }
    if (activeTag) {
      return filteredByTag || [];
    }
    return [];
  }, [query, activeTag, fuse, filteredByTag]);

  const hasActiveSearch = query || activeTag;

  // Tags from current results for refinement
  const resultTags = useMemo(() => {
    const pool = hasActiveSearch ? results : posts;
    const counts: Record<string, number> = {};
    for (const post of pool) {
      for (const tag of post.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count }));
  }, [hasActiveSearch, results, posts]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.trim()) {
      saveRecentSearch(q.trim());
      setRecentSearches(getRecentSearches());
    }
  }, []);

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setActiveTag("");
      router.replace(query ? `/search?q=${encodeURIComponent(query)}` : "/search", { scroll: false });
    } else {
      setActiveTag(tag);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("tag", tag);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleClearAll = () => {
    setQuery("");
    setActiveTag("");
    router.replace("/search", { scroll: false });
  };

  return (
    <div className="mx-auto max-w-container px-5 sm:px-8 pb-16 pt-12">
      {/* Search Input */}
      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="제목, 내용, 태그로 검색..."
          autoFocus
          className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 pl-12 text-body text-text-primary outline-none transition-all duration-base placeholder:text-text-muted focus:border-brand-primary"
        />
        {(query || activeTag) && (
          <button onClick={handleClearAll}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Active Tag Badge */}
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <Tag size={14} className="text-brand-primary" />
          <span className="text-meta text-text-secondary">태그 필터:</span>
          <button
            onClick={() => handleTagClick(activeTag)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-[0.8125rem] font-medium text-brand-primary transition-colors hover:bg-brand-primary/20"
          >
            #{activeTag}
            <X size={12} />
          </button>
        </div>
      )}

      {/* No active search — show recent + popular tags */}
      {!hasActiveSearch && !loading && (
        <div className="space-y-8">
          {recentSearches.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-card-desc font-semibold">
                  <Clock size={15} /> 최근 검색어
                </h3>
                <button onClick={handleClearRecent} className="text-meta text-text-muted hover:text-text-primary">
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((q) => (
                  <button key={q} onClick={() => handleSearch(q)}
                    className="rounded-full border border-border px-3 py-1.5 text-meta text-text-secondary transition-all hover:border-brand-primary hover:text-brand-primary">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {popularTags.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-card-desc font-semibold">
                <TrendingUp size={15} /> 인기 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(({ tag, count }) => (
                  <button key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="rounded-full border border-border px-3 py-1.5 text-meta text-text-secondary transition-all hover:border-brand-primary hover:text-brand-primary">
                    #{tag} <span className="ml-1 text-text-muted">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {hasActiveSearch && (
        <>
          {loading ? (
            <p className="text-center text-text-tertiary">로딩 중...</p>
          ) : (
            <>
              {/* Result tag filters */}
              {resultTags.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-2 flex items-center gap-1.5 text-meta font-medium text-text-muted">
                    <Tag size={13} /> 태그로 필터
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resultTags.map(({ tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`rounded-full border px-2.5 py-1 text-[0.75rem] font-medium transition-all duration-base ${
                          activeTag === tag
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                            : "border-border text-text-tertiary hover:border-brand-primary hover:text-brand-primary"
                        }`}
                      >
                        #{tag}
                        <span className="ml-1 text-text-muted">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.length === 0 ? (
                <p className="text-center text-text-tertiary">
                  {query && <>&quot;{query}&quot;</>}
                  {query && activeTag && " + "}
                  {activeTag && <>#{activeTag}</>}
                  에 대한 검색 결과가 없습니다.
                </p>
              ) : (
                <div className="flex flex-col gap-px">
                  <p className="mb-4 text-card-desc text-text-secondary">
                    {results.length}개의 검색 결과
                    {activeTag && <span className="ml-1 text-brand-primary">#{activeTag}</span>}
                  </p>
                  {results.map((post) => (
                    <PostItem key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
