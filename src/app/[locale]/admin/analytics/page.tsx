"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface PostStat {
  id: string;
  title: string;
  slug: string;
  views: number;
  botViews: number;
  category: string;
}

interface DailyStat {
  date: string;
  views: number;
  botViews: number;
}

interface CategoryStat {
  category: string;
  views: number;
}

const AnalyticsPage = () => {
  const [postStats, setPostStats] = useState<PostStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalBotViews, setTotalBotViews] = useState(0);
  const [period, setPeriod] = useState<"7" | "30">("7");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/admin/analytics?days=${period}`);
        const data = await res.json();
        if (data.success) {
          setPostStats(data.data.topPosts || []);
          setDailyStats(data.data.daily || []);
          setCategoryStats(data.data.byCategory || []);
          setTotalViews(data.data.totalViews || 0);
          setTotalBotViews(data.data.totalBotViews || 0);
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, [period]);

  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-section-title">통계</h1>
        <div className="flex gap-2">
          {(["7", "30"] as const).map((d) => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`rounded-full border px-3 py-1 text-meta font-medium transition-all ${
                period === d ? "border-text-primary bg-text-primary text-bg-primary" : "border-border text-text-tertiary"
              }`}>
              {d}일
            </button>
          ))}
        </div>
      </div>

      {/* Total views */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border p-6">
          <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
          <div className="text-meta text-text-tertiary">사람 조회수 ({period}일)</div>
        </div>
        <div className="rounded-xl border border-border p-6">
          <div className="text-3xl font-bold text-text-secondary">{totalBotViews.toLocaleString()}</div>
          <div className="text-meta text-text-tertiary">봇 조회수 ({period}일)</div>
        </div>
        <div className="rounded-xl border border-border p-6">
          <div className="text-3xl font-bold text-brand-primary">{(totalViews + totalBotViews).toLocaleString()}</div>
          <div className="text-meta text-text-tertiary">전체 조회수 ({period}일)</div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="mb-8">
        <h2 className="mb-3 text-sub-heading">일별 조회수</h2>
        <div className="rounded-xl border border-border p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--text-tertiary)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--text-tertiary)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="views" stackId="a" fill="#3182F6" radius={[0, 0, 0, 0]} name="사람" />
              <Bar dataKey="botViews" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} name="봇" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mb-8">
        <h2 className="mb-3 text-sub-heading">카테고리별 조회수</h2>
        <div className="rounded-xl border border-border p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--text-tertiary)" }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: "var(--text-tertiary)" }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="views" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top posts */}
      <div className="mb-8">
        <h2 className="mb-3 text-sub-heading">조회수 Top 10</h2>
        <div className="divide-y divide-border-light rounded-xl border border-border">
          {postStats.length === 0 ? (
            <div className="px-4 py-8 text-center text-meta text-text-muted">조회 데이터가 없습니다.</div>
          ) : (
            postStats.map((post, i) => (
              <div key={post.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 text-center text-meta font-bold text-text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-card-desc font-medium">{post.title}</div>
                  <div className="text-meta text-text-tertiary">{post.category}</div>
                </div>
                <div className="text-right">
                  <span className="text-card-desc font-semibold">{post.views.toLocaleString()}</span>
                  {post.botViews > 0 && (
                    <span className="ml-2 text-meta text-text-muted">+{post.botViews.toLocaleString()} 봇</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Umami embed */}
      {umamiUrl && (
        <div>
          <h2 className="mb-3 text-sub-heading">Umami 대시보드</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={`${umamiUrl}/share/dashboard`}
              className="h-[600px] w-full border-0"
              title="Umami Analytics"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
