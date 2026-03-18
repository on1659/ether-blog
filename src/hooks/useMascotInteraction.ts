"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseMascotInteractionOptions {
  messages?: string[];
  comboEnabled?: boolean;
}

interface UseMascotInteractionReturn {
  clickCount: number;
  bubbleText: string;
  bubbleVisible: boolean;
  animationClass: string;
  expression: "normal" | "happy" | "confused" | "sleeping";
  ledColor: string;
  handleClick: () => void;
}

const DEFAULT_MESSAGES = [
  "안녕하세요! 반가워요 :)",
  "오늘도 코딩 중이신가요?",
  "커밋을 하면 글이 되어요!",
  "버그 없는 하루 되세요~",
  "AI와 함께하는 개발, 재밌죠?",
  "이더봇이에요. 잘 부탁드려요!",
  "TypeScript는 정의입니다.",
  "다크모드가 눈에 편하죠?",
  "오늘의 TIL을 작성해 보세요!",
  "저도 가끔 쉬고 싶어요...",
];

const RAINBOW_COLORS = [
  "#3182F6",
  "#00C471",
  "#FF6B35",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
];

export const useMascotInteraction = (
  options: UseMascotInteractionOptions = {}
): UseMascotInteractionReturn => {
  const { messages = DEFAULT_MESSAGES, comboEnabled = true } = options;

  const [clickCount, setClickCount] = useState(0);
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState("idle");
  const [expression, setExpression] =
    useState<UseMascotInteractionReturn["expression"]>("normal");
  const [ledColor, setLedColor] = useState("#00C471");

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rainbowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const rainbowIndexRef = useRef(0);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (rainbowIntervalRef.current)
        clearInterval(rainbowIntervalRef.current);
    };
  }, []);

  const stopRainbow = useCallback(() => {
    if (rainbowIntervalRef.current) {
      clearInterval(rainbowIntervalRef.current);
      rainbowIntervalRef.current = null;
    }
  }, []);

  const startRainbow = useCallback(() => {
    stopRainbow();
    rainbowIndexRef.current = 0;
    rainbowIntervalRef.current = setInterval(() => {
      rainbowIndexRef.current =
        (rainbowIndexRef.current + 1) % RAINBOW_COLORS.length;
      setLedColor(RAINBOW_COLORS[rainbowIndexRef.current]);
    }, 200);
  }, [stopRainbow]);

  const resetToIdle = useCallback(
    (delay: number) => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      animationTimerRef.current = setTimeout(() => {
        setAnimationClass("idle");
        setExpression("normal");
        stopRainbow();
        setLedColor("#00C471");
      }, delay);
    },
    [stopRainbow]
  );

  const showBubble = useCallback(
    (text: string) => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      setBubbleText(text);
      setBubbleVisible(true);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleVisible(false);
      }, 2500);
    },
    []
  );

  const handleClick = useCallback(() => {
    // Pick a random message from the pool
    const randomIndex = Math.floor(Math.random() * messages.length);
    const message = messages[randomIndex];
    showBubble(message);

    if (!comboEnabled) {
      setExpression("happy");
      setAnimationClass("surprised");
      resetToIdle(500);
      return;
    }

    // Combo system: reset combo timer on each click
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    setClickCount((prev) => {
      const newCount = prev + 1;

      // Apply combo effects based on click count
      if (newCount >= 10) {
        // 10+ clicks: rainbow mode
        setAnimationClass("spinning");
        setExpression("happy");
        startRainbow();
        resetToIdle(3000);
      } else if (newCount >= 5) {
        // 5+ clicks: spinning
        setAnimationClass("spinning");
        setExpression("happy");
        setLedColor("#06B6D4");
        resetToIdle(1500);
      } else if (newCount >= 3) {
        // 3+ clicks: dancing
        setAnimationClass("dancing");
        setExpression("happy");
        setLedColor("#FF6B35");
        resetToIdle(1200);
      } else {
        // 1 click: surprised jump
        setAnimationClass("surprised");
        setExpression("happy");
        setLedColor("#00C471");
        resetToIdle(500);
      }

      return newCount;
    });

    // Reset combo counter after 1.2s of no clicking
    comboTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 1200);
  }, [messages, comboEnabled, showBubble, resetToIdle, startRainbow]);

  return {
    clickCount,
    bubbleText,
    bubbleVisible,
    animationClass,
    expression,
    ledColor,
    handleClick,
  };
};

export default useMascotInteraction;
