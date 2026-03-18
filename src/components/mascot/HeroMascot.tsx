"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const MascotSVG = dynamic(
  () =>
    import("./MascotSVG").then((m) => ({ default: m.MascotSVG })),
  { ssr: false }
);

const MAIN_MESSAGES = [
  "안녕하세요! 👋",
  "산책 중이에요~",
  "좋은 하루!",
  "코딩하러 가는 길!",
  "블로그 구경 중 🤖",
];

const SUB_MESSAGES = [
  "...누구세요?",
  "저도 놀아주세요!",
  "보라봇이에요~",
  "비밀 임무 중! 🔮",
];

interface WalkingBotProps {
  theme: "blue" | "purple";
  size: number;
  messages: string[];
  direction: "ltr" | "rtl";
  duration: number;
  delay: number;
  opacity?: number;
}

const WalkingBot = ({
  theme,
  size,
  messages,
  direction,
  duration,
  delay,
  opacity = 1,
}: WalkingBotProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);

    if (clickCountRef.current >= 5) {
      setIsSpinning(true);
      clickCountRef.current = 0;
      setTimeout(() => setIsSpinning(false), 1000);
      return;
    }

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setBubble(randomMsg);
    setIsPaused(true);

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setBubble(null);
      setIsPaused(false);
    }, 3000);
  }, [messages]);

  const animationName = direction === "ltr" ? "mascot-walk-ltr" : "mascot-walk-rtl";

  return (
    <div
      className="absolute bottom-0 cursor-pointer"
      style={{
        animation: `${animationName} ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        animationPlayState: isPaused ? "paused" : "running",
        opacity,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${theme === "blue" ? "메인" : "서브"} 마스코트 봇`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div
        className={`relative ${isSpinning ? "mascot-spin" : ""}`}
        style={{ width: size, height: size }}
      >
        <MascotSVG theme={theme} size={size} animation="walk" />
        {bubble && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[#1B1D1F] shadow-lg"
            style={{ animation: "mascot-bubble-in 0.2s ease-out" }}
          >
            {bubble}
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export const HeroMascot = () => {
  return (
    <div className="pointer-events-auto relative z-20 h-12 w-full overflow-hidden">
      <WalkingBot
        theme="blue"
        size={48}
        messages={MAIN_MESSAGES}
        direction="ltr"
        duration={18}
        delay={0}
      />
      <WalkingBot
        theme="purple"
        size={36}
        messages={SUB_MESSAGES}
        direction="rtl"
        duration={22}
        delay={5}
        opacity={0.35}
      />

      <style jsx global>{`
        @keyframes mascot-walk-ltr {
          0% {
            left: -60px;
          }
          100% {
            left: calc(100% + 60px);
          }
        }

        @keyframes mascot-walk-rtl {
          0% {
            right: -60px;
            left: auto;
          }
          100% {
            right: calc(100% + 60px);
            left: auto;
          }
        }

        @keyframes mascot-bubble-in {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .mascot-spin {
          animation: mascot-spin-anim 1s ease-in-out !important;
        }

        @keyframes mascot-spin-anim {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
};

export default HeroMascot;
