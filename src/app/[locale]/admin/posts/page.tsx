"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { PostMeta } from "@/types";

const AdminPostsPage = () => {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "all") params.set("category", filter);
      const res = await fetch(`/api/v1/posts?${params}`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/v1/posts/${id}`, { method: "DELETE" });
      fetchPosts();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-section-title">글 관리</h1>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {["all", "commits", "articles", "techlab", "casual"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full border px-3 py-1 text-meta font-medium transition-all duration-base ${
              filter === cat
                ? "border-text-primary bg-text-primary text-bg-primary"
                : "border-border text-text-tertiary hover:border-text-tertiary"
            }`}
          >
            {cat === "all" ? "전체" : cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-bg-secondary">
            <tr>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">제목</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">카테고리</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">상태</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">날짜</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  로딩 중...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  게시물이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="transition-colors hover:bg-bg-secondary">
                  <td className="max-w-xs truncate px-4 py-3 text-card-desc font-medium">
                    {post.title}
                  </td>
                  <td className="px-4 py-3 text-meta text-text-tertiary">{post.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[0.6875rem] font-semibold ${
                        post.published
                          ? "bg-[rgba(0,196,113,0.12)] text-cat-commits"
                          : "bg-bg-tertiary text-text-muted"
                      }`}
                    >
                      {post.published ? "발행" : "임시저장"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-meta text-text-tertiary">
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-[rgba(255,107,53,0.12)] hover:text-cat-casual"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPostsPage;
