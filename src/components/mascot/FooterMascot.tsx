"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const MascotSVG = dynamic(
  () =>
    import("./MascotSVG").then((m) => ({ default: m.MascotSVG })),
  { ssr: false }
);

const FOOTER_MESSAGES = [
  "또 놀러오세요!",
  "좋은 하루 보내세요 :)",
  "코드는 예술이에요~",
  "다음 글도 기대해주세요!",
];

export const FooterMascot = () => {
  const [bubble, setBubble] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    const randomMsg =
      FOOTER_MESSAGES[Math.floor(Math.random() * FOOTER_MESSAGES.length)];
    setBubble(randomMsg);

    setTimeout(() => {
      setBubble(null);
    }, 2500);
  }, []);

  return (
    <div
      className="relative mr-2 inline-flex cursor-pointer items-center transition-transform duration-200 hover:scale-110"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="푸터 마스코트 봇"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div className="mascot-idle" style={{ width: 32, height: 32 }}>
        <MascotSVG theme="blue" size={32} animation="idle" />
      </div>

      {bubble && (
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-[#1B1D1F] shadow-md dark:bg-[#2B2D31] dark:text-[#ECECEC]"
          style={{ animation: "footer-bubble-in 0.2s ease-out" }}
        >
          {bubble}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white dark:bg-[#2B2D31]" />
        </div>
      )}

      <style jsx global>{`
        .mascot-idle {
          animation: mascot-idle-breathe 3s ease-in-out infinite;
        }

        @keyframes mascot-idle-breathe {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes footer-bubble-in {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FooterMascot;
