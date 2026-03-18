"use client";

import React from "react";

interface MascotSVGProps {
  size?: number;
  theme?: "blue" | "purple";
  expression?: "normal" | "happy" | "confused" | "sleeping";
  ledColor?: string;
  className?: string;
  /** CSS animation is handled by the wrapper element; accepted here for convenience. */
  animation?: string;
}

const THEMES = {
  blue: {
    main: "#3182F6",
    dark: "#1E3A5F",
    screen: "#0F172A",
    accent: "#60A5FA",
  },
  purple: {
    main: "#8B5CF6",
    dark: "#3B1F6E",
    screen: "#1A0A3E",
    accent: "#A78BFA",
  },
} as const;

const renderEyes = (
  expression: MascotSVGProps["expression"],
  accent: string
) => {
  switch (expression) {
    case "happy":
      return (
        <>
          <rect
            className="mascot-eye"
            x="16"
            y="13"
            width="6"
            height="6"
            rx="1"
            fill={accent}
          />
          <rect
            className="mascot-eye"
            x="26"
            y="13"
            width="6"
            height="6"
            rx="1"
            fill={accent}
          />
        </>
      );
    case "confused":
      return (
        <>
          {/* Left eye: X shape */}
          <line
            x1="17"
            y1="14"
            x2="22"
            y2="19"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="22"
            y1="14"
            x2="17"
            y2="19"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Right eye: X shape */}
          <line
            x1="26"
            y1="14"
            x2="31"
            y2="19"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="31"
            y1="14"
            x2="26"
            y2="19"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    case "sleeping":
      return (
        <>
          <line
            x1="17"
            y1="16"
            x2="22"
            y2="16"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="26"
            y1="16"
            x2="31"
            y2="16"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    case "normal":
    default:
      return (
        <>
          <rect
            className="mascot-eye"
            x="17"
            y="14"
            width="5"
            height="5"
            rx="1"
            fill={accent}
          />
          <rect
            className="mascot-eye"
            x="26"
            y="14"
            width="5"
            height="5"
            rx="1"
            fill={accent}
          />
        </>
      );
  }
};

const renderMouth = (
  expression: MascotSVGProps["expression"],
  accent: string
) => {
  switch (expression) {
    case "happy":
      return (
        <path
          d="M20 21 Q24 24 28 21"
          stroke={accent}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      );
    case "confused":
      return (
        <path
          d="M20 21 Q22 23 24 21 Q26 19 28 21"
          stroke={accent}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      );
    case "sleeping":
      return null;
    case "normal":
    default:
      return (
        <rect
          x="20"
          y="21"
          width="8"
          height="1"
          rx="0.5"
          fill={accent}
          opacity="0.6"
        />
      );
  }
};

export const MascotSVG: React.FC<MascotSVGProps> = ({
  size = 48,
  theme = "blue",
  expression = "normal",
  ledColor = "#00C471",
  className = "",
  animation: _animation,
}) => {
  void _animation; // animation is applied via CSS on the wrapper, not inside the SVG
  const t = THEMES[theme];
  const height = (size / 48) * 56;

  return (
    <svg
      className={className}
      viewBox="0 0 48 56"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={height}
      aria-hidden="true"
      style={{ imageRendering: "auto" }}
    >
      {/* Antenna */}
      <rect
        x="22"
        y="0"
        width="4"
        height="6"
        fill={t.accent}
        opacity="0.9"
      />
      <rect
        x="20"
        y="0"
        width="8"
        height="2"
        fill={t.accent}
        opacity="0.6"
      />

      {/* Head - outer shell */}
      <rect x="10" y="6" width="28" height="22" rx="4" fill={t.main} />
      {/* Head - inner bezel */}
      <rect x="12" y="8" width="24" height="18" rx="3" fill={t.dark} />
      {/* Head - screen */}
      <rect x="14" y="10" width="20" height="14" rx="2" fill={t.screen} />

      {/* Eyes */}
      {renderEyes(expression, t.accent)}

      {/* Mouth */}
      {renderMouth(expression, t.accent)}

      {/* Body - outer */}
      <rect x="14" y="30" width="20" height="16" rx="3" fill={t.main} />
      {/* Body - inner */}
      <rect x="16" y="32" width="16" height="12" rx="2" fill={t.dark} />

      {/* Chest LED */}
      <rect x="21" y="34" width="6" height="6" rx="1" fill={ledColor} />
      <rect
        x="22"
        y="35"
        width="4"
        height="4"
        rx="1"
        fill={ledColor}
        opacity="0.5"
      />

      {/* Arms */}
      <rect x="6" y="32" width="8" height="4" rx="2" fill={t.main} />
      <rect x="34" y="32" width="8" height="4" rx="2" fill={t.main} />

      {/* Legs */}
      <rect x="16" y="46" width="6" height="8" rx="2" fill={t.main} />
      <rect x="26" y="46" width="6" height="8" rx="2" fill={t.main} />

      {/* Feet */}
      <rect x="14" y="52" width="10" height="4" rx="2" fill={t.dark} />
      <rect x="24" y="52" width="10" height="4" rx="2" fill={t.dark} />
    </svg>
  );
};

export default MascotSVG;
