"use client";

import { useEffect } from "react";

export const ViewTracker = ({ postId }: { postId: string }) => {
  useEffect(() => {
    const track = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
          }),
        });
      } catch { /* silent */ }
    };
    track();
  }, [postId]);

  return null;
};
