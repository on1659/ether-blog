"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const MascotSVG = dynamic(
  () => import("./MascotSVG").then((m) => ({ default: m.MascotSVG })),
  { ssr: false }
);

export const NotFoundMascot = () => {
  const [questionMark, setQuestionMark] = useState("?");
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isPaused) return;

    setIsPaused(true);
    setQuestionMark("!");

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setQuestionMark("?");
      setIsPaused(false);
    }, 1500);
  }, [isPaused]);

  return (
    <div className="relative mx-auto my-8 h-[120px] w-[300px]">
      {/* Footprints */}
      <div className="absolute bottom-3 flex w-full justify-around">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-1 w-1.5 rounded-full opacity-30"
            style={{ background: "var(--text-muted)" }}
          />
        ))}
      </div>

      {/* Lost mascot - wandering */}
      <div
        className="absolute bottom-5 cursor-pointer"
        style={{
          animation:
            "lost-wander 6s ease-in-out infinite, mascot-walk 0.4s ease-in-out infinite",
          animationPlayState: isPaused ? "paused" : "running",
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="길 잃은 마스코트 봇"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
      >
        <div className="relative">
          {/* Question / Exclamation mark */}
          <span
            className="absolute -right-1.5 -top-3 text-base font-extrabold"
            style={{
              color: questionMark === "!" ? "#EF4444" : "var(--brand-primary)",
              animation: "question-float 3s ease-in-out infinite",
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {questionMark}
          </span>

          {/* Mascot */}
          <MascotSVG
            size={56}
            theme="blue"
            expression="confused"
            ledColor="#EF4444"
          />

          {/* Shadow */}
          <div
            className="mascot-shadow mx-auto mt-0.5"
            style={{ width: 40 }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotFoundMascot;
