"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MoreVertical, Pencil, Trash2, FolderSync, ListOrdered, Plus, RefreshCw, X, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostMeta } from "@/types";

/* ───── Toast ───── */

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const ToastContainer = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 ${
          t.type === "success"
            ? "border-cat-commits/30 bg-[rgba(0,196,113,0.08)] text-cat-commits"
            : t.type === "error"
              ? "border-cat-casual/30 bg-[rgba(255,107,53,0.08)] text-cat-casual"
              : "border-cat-signal/30 bg-[rgba(6,182,212,0.08)] text-cat-signal"
        }`}
      >
        {t.type === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> :
         t.type === "error" ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> :
         <RefreshCw size={18} className="mt-0.5 shrink-0 animate-spin" />}
        <span className="max-w-xs text-sm font-medium leading-snug">{t.message}</span>
        <button onClick={() => onDismiss(t.id)} className="shrink-0 rounded p-0.5 transition-colors hover:bg-black/10">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

/* ───── Main ───── */

const CATEGORIES = ["commits", "articles", "casual", "signal", "hallucination"] as const;

const AdminPostsPage = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [categoryModal, setCategoryModal] = useState<string[] | null>(null);
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    if (type !== "info") {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "9999" });
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

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`${ids.length}개의 글을 삭제하시겠습니까?`)) return;
    try {
      await Promise.all(ids.map((id) => fetch(`/api/admin/posts/${id}`, { method: "DELETE" })));
      setSelected(new Set());
      setMenuOpen(null);
      fetchPosts();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const regenerateOne = async (id: string): Promise<{ ok: boolean; upgraded?: boolean; prev?: number | null; next?: number; error?: string }> => {
    setRegenerating((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/admin/posts/${id}/regenerate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        return { ok: true, upgraded: data.data.upgraded, prev: data.data.previousScore, next: data.data.newScore };
      }
      return { ok: false, error: data.error };
    } catch {
      return { ok: false, error: "네트워크 오류" };
    } finally {
      setRegenerating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm("이 글을 AI로 재생성하시겠습니까? (1~2분 소요)")) return;
    setMenuOpen(null);
    const progressId = addToast("info", "재생성 중...");
    const result = await regenerateOne(id);
    removeToast(progressId);
    if (result.ok) {
      addToast(
        result.upgraded ? "success" : "info",
        result.upgraded
          ? `재생성 성공! ${result.prev} → ${result.next}점, signal 승격`
          : `재생성 완료. ${result.prev} → ${result.next}점 (아직 미통과)`
      );
    } else {
      addToast("error", `재생성 실패: ${result.error}`);
    }
    fetchPosts();
  };

  const handleBulkRegenerate = async (ids: string[]) => {
    if (!confirm(`${ids.length}개의 글을 AI로 재생성하시겠습니까?`)) return;
    const progressId = addToast("info", `0/${ids.length} 재생성 중...`);
    let upgraded = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      setToasts((prev) => prev.map((t) => t.id === progressId ? { ...t, message: `${i + 1}/${ids.length} 재생성 중...` } : t));
      const result = await regenerateOne(ids[i]);
      if (result.ok && result.upgraded) upgraded++;
      else if (!result.ok) failed++;
    }
    removeToast(progressId);
    addToast(
      failed === ids.length ? "error" : "success",
      `재생성 완료: ${ids.length}건 중 ${upgraded}건 승격${failed > 0 ? `, ${failed}건 실패` : ""}`
    );
    setSelected(new Set());
    fetchPosts();
  };

  const handleCategoryChange = async (ids: string[], category: string) => {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/posts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category }),
          })
        )
      );
      setSelected(new Set());
      setCategoryModal(null);
      setMenuOpen(null);
      fetchPosts();
    } catch {
      alert("카테고리 변경에 실패했습니다.");
    }
  };

  const selectedCount = selected.size;
  const allChecked = posts.length > 0 && selected.size === posts.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-section-title">글 관리</h1>
          <button
            onClick={async () => {
              if (!confirm("모든 글의 slug를 숫자로 재정렬하시겠습니까?")) return;
              const res = await fetch("/api/admin/posts/renumber", { method: "POST" });
              const data = await res.json();
              if (data.success) {
                alert(`완료: ${data.data.updated}개 변경됨`);
                fetchPosts();
              } else {
                alert("실패: " + data.error);
              }
            }}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-meta font-medium text-text-tertiary transition-colors hover:bg-bg-secondary hover:text-text-primary"
          >
            <ListOrdered size={13} />
            번호 재정렬
          </button>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1 text-meta font-semibold text-white transition-colors hover:opacity-90"
          >
            <Plus size={13} />
            글쓰기
          </Link>
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-meta text-text-tertiary">{selectedCount}개 선택</span>
            <button
              onClick={() => setCategoryModal(Array.from(selected))}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-meta font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
            >
              <FolderSync size={13} />
              카테고리 변경
            </button>
            {filter === "hallucination" && (
              <button
                onClick={() => handleBulkRegenerate(Array.from(selected))}
                disabled={regenerating.size > 0}
                className="flex items-center gap-1 rounded-lg border border-cat-signal px-3 py-1.5 text-meta font-medium text-cat-signal transition-colors hover:bg-[rgba(6,182,212,0.12)] disabled:opacity-50"
              >
                <RefreshCw size={13} className={regenerating.size > 0 ? "animate-spin" : ""} />
                재생성
              </button>
            )}
            <button
              onClick={() => handleDelete(Array.from(selected))}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-meta font-medium text-cat-casual transition-colors hover:bg-[rgba(255,107,53,0.12)]"
            >
              <Trash2 size={13} />
              삭제
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {["all", ...CATEGORIES].map((cat) => (
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
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-border accent-brand-primary"
                />
              </th>
              <th className="w-12 px-4 py-3 text-center text-meta font-semibold text-text-tertiary">No.</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">제목</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">카테고리</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">상태</th>
              <th className="px-4 py-3 text-meta font-semibold text-text-tertiary">날짜</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  로딩 중...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                  게시물이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr
                  key={post.id}
                  className={`transition-colors hover:bg-bg-secondary ${
                    selected.has(post.id) ? "bg-bg-secondary/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="h-4 w-4 cursor-pointer rounded border-border accent-brand-primary"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-meta text-text-muted">
                    {posts.length - index}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-card-desc font-medium">
                    <a
                      href={`/post/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-primary hover:underline"
                    >
                      {post.title}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-meta text-text-tertiary">
                    <span className={post.category === "hallucination" ? "text-cat-casual" : ""}>
                      {post.category}
                    </span>
                    {post.validationScore != null && post.validationScore < 80 && (
                      <span className="ml-1.5 rounded bg-[rgba(255,107,53,0.12)] px-1.5 py-0.5 text-[0.625rem] font-semibold text-cat-casual">
                        {post.validationScore}점
                      </span>
                    )}
                    {regenerating.has(post.id) && (
                      <RefreshCw size={12} className="ml-1.5 inline animate-spin text-cat-signal" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/admin/posts/${post.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ published: !post.published }),
                        });
                        const data = await res.json();
                        if (!data.success) alert("실패: " + data.error);
                        fetchPosts();
                      }}
                      className={`rounded px-2 py-0.5 text-[0.6875rem] font-semibold transition-colors ${
                        post.published
                          ? "bg-[rgba(0,196,113,0.12)] text-cat-commits hover:bg-[rgba(0,196,113,0.25)]"
                          : "bg-bg-tertiary text-text-muted hover:bg-bg-secondary"
                      }`}
                    >
                      {post.published ? "발행" : "미발행"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-meta text-text-tertiary">
                    {new Date(post.createdAt).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Seoul",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        if (menuOpen === post.id) {
                          setMenuOpen(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
                          setMenuOpen(post.id);
                        }
                      }}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === post.id && (
                      <div
                        ref={menuRef}
                        className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-border bg-bg-primary shadow-lg"
                        style={{ top: menuPos.top, left: menuPos.left }}
                      >
                        <button
                          onClick={() => {
                            setMenuOpen(null);
                            router.push(`/admin/posts/${post.id}/edit`);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                        >
                          <Pencil size={14} />
                          글 수정
                        </button>
                        <button
                          onClick={() => {
                            setCategoryModal([post.id]);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                        >
                          <FolderSync size={14} />
                          카테고리 변경
                        </button>
                        {post.category === "hallucination" && (
                          <button
                            onClick={() => handleRegenerate(post.id)}
                            disabled={regenerating.has(post.id)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-cat-signal transition-colors hover:bg-[rgba(6,182,212,0.12)] disabled:opacity-50"
                          >
                            <RefreshCw size={14} className={regenerating.has(post.id) ? "animate-spin" : ""} />
                            {regenerating.has(post.id) ? "재생성 중..." : "AI 재생성"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleDelete([post.id]);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-cat-casual transition-colors hover:bg-[rgba(255,107,53,0.12)]"
                        >
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Category Change Modal */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCategoryModal(null)}>
          <div className="w-[320px] rounded-xl border border-border bg-bg-primary p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold text-text-primary">카테고리 변경</h3>
            <p className="mb-4 text-meta text-text-tertiary">{categoryModal.length}개의 글</p>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(categoryModal, cat)}
                  className="rounded-lg border border-border px-4 py-2.5 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCategoryModal(null)}
              className="mt-4 w-full rounded-lg bg-bg-secondary py-2 text-sm text-text-tertiary transition-colors hover:text-text-primary"
            >
              취소
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPostsPage;
