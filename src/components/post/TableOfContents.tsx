"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents = ({ headings }: { headings: TocItem[] }) => {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden w-[200px] flex-shrink-0 self-start pt-14 lg:sticky lg:top-[112px] lg:block">
      <div className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
        On this page
      </div>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`block border-l-2 py-[5px] pl-3.5 text-meta transition-all duration-base ${
            activeId === h.id
              ? "border-brand-primary font-medium text-brand-primary"
              : "border-border-light text-text-tertiary hover:text-text-primary"
          } ${h.level === 3 ? "pl-7" : ""}`}
        >
          {h.text}
        </a>
      ))}
    </aside>
  );
};
