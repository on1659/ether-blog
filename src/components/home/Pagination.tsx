"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  category?: string;
}

export const Pagination = ({ currentPage, totalPages, category }: PaginationProps) => {
  const pathname = usePathname();

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Show max 5 page numbers around current page
  const range: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) range.push(i);

  return (
    <nav className="flex items-center justify-center gap-1 pt-10">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary"
        >
          ←
        </Link>
      )}

      {range[0] > 1 && (
        <>
          <Link
            href={buildHref(1)}
            className="rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary"
          >
            1
          </Link>
          {range[0] > 2 && (
            <span className="px-1 text-sm text-text-muted">…</span>
          )}
        </>
      )}

      {range.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            p === currentPage
              ? "bg-text-primary text-bg-primary"
              : "text-text-tertiary hover:bg-card-hover hover:text-text-primary"
          }`}
        >
          {p}
        </Link>
      ))}

      {range[range.length - 1] < totalPages && (
        <>
          {range[range.length - 1] < totalPages - 1 && (
            <span className="px-1 text-sm text-text-muted">…</span>
          )}
          <Link
            href={buildHref(totalPages)}
            className="rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary"
        >
          →
        </Link>
      )}
    </nav>
  );
};
