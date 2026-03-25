"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export const GiscusComments = () => {
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "on1659/radar-blog");
    script.setAttribute("data-repo-id", "R_kgDORiWQIg");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDORiWQIs4C5NKV");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    script.setAttribute("data-lang", "ko");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    ref.current.innerHTML = "";
    ref.current.appendChild(script);
  }, [theme]);

  return (
    <div className="mx-auto max-w-content px-5 sm:px-8 pb-20">
      <div ref={ref} />
    </div>
  );
};
