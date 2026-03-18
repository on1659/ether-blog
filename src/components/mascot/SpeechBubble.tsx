"use client";

import React from "react";

interface SpeechBubbleProps {
  text: string;
  visible: boolean;
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  visible,
  className = "",
}) => {
  return (
    <div
      className={[
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
        "rounded-xl px-3.5 py-2",
        "text-xs whitespace-nowrap",
        "bg-[var(--bg-primary)] text-[var(--text-primary)]",
        "border-2 border-[var(--border)]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
        "pointer-events-none",
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {text}
      {/* Tail triangle */}
      <span
        className={[
          "absolute top-full left-1/2 -translate-x-1/2",
          "border-[6px] border-transparent",
          "border-t-[var(--bg-primary)]",
        ].join(" ")}
      />
      {/* Tail border (outer) - rendered behind the fill triangle */}
      <span
        className={[
          "absolute left-1/2 -translate-x-1/2",
          "border-[7px] border-transparent",
          "border-t-[var(--border)]",
          "-z-10",
        ].join(" ")}
        style={{ top: "calc(100% + 1px)" }}
      />
    </div>
  );
};

export default SpeechBubble;
