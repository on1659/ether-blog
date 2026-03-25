"use client";

import { useRef, useEffect, useState } from "react";

interface HtmlContentProps {
  html: string;
}

export const HtmlContent = ({ html }: HtmlContentProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  // Detect if it's a full HTML document or a fragment
  const isFullDocument = /^\s*<!doctype|^\s*<html/i.test(html);

  const srcdoc = isFullDocument
    ? html.replace(
        "</body>",
        `<script>
          const sendHeight = () => {
            window.parent.postMessage({ type: 'html-content-height', height: document.documentElement.scrollHeight }, '*');
          };
          window.addEventListener('load', sendHeight);
          new ResizeObserver(sendHeight).observe(document.body);
        </script></body>`
      )
    : `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; margin: 0; padding: 0; line-height: 1.85; font-size: 17px; color: #1B1D1F; }
  img { max-width: 100%; height: auto; }
  pre, code { font-family: 'JetBrains Mono', monospace; }
  @media (prefers-color-scheme: dark) {
    body { background: transparent; color: #ECECEC; }
  }
</style>
</head>
<body>${html}
<script>
  const sendHeight = () => {
    window.parent.postMessage({ type: 'html-content-height', height: document.documentElement.scrollHeight }, '*');
  };
  window.addEventListener('load', sendHeight);
  new ResizeObserver(sendHeight).observe(document.body);
</script>
</body>
</html>`;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (
        e.data?.type === "html-content-height" &&
        e.source === iframeRef.current?.contentWindow
      ) {
        setHeight(Math.max(300, e.data.height));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      sandbox="allow-scripts allow-same-origin"
      className="w-full border-0"
      style={{ height, minHeight: 300 }}
      title="HTML content"
    />
  );
};
