import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          muted: "var(--text-muted)",
        },
        brand: {
          primary: "var(--brand-primary)",
          "primary-light": "var(--brand-primary-light)",
          "primary-dark": "var(--brand-primary-dark)",
        },
        cat: {
          commits: "#00C471",
          articles: "#3182F6",
          techlab: "#8B5CF6",
          casual: "#FF6B35",
        },
        code: {
          bg: "var(--code-bg)",
          text: "var(--code-text)",
        },
        border: {
          DEFAULT: "var(--border)",
          light: "var(--border-light)",
        },
        card: {
          bg: "var(--card-bg)",
          hover: "var(--card-hover)",
        },
      },
      fontFamily: {
        body: ["var(--font-body)"],
        heading: ["var(--font-heading)"],
        code: ["var(--font-code)"],
      },
      fontSize: {
        "page-title": ["2.25rem", { lineHeight: "1.3", fontWeight: "800" }],
        "section-title": ["1.5rem", { lineHeight: "1.4", fontWeight: "700" }],
        "sub-heading": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["1.0625rem", { lineHeight: "1.85", fontWeight: "400" }],
        "card-title": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "card-desc": ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        meta: ["0.8125rem", { lineHeight: "1.4", fontWeight: "400" }],
        "code-block": ["0.875rem", { lineHeight: "1.7", fontWeight: "400" }],
        tag: ["0.75rem", { lineHeight: "1.0", fontWeight: "500" }],
      },
      maxWidth: {
        container: "1100px",
        content: "720px",
      },
      spacing: {
        18: "4.5rem",
        "section-sm": "2rem",
        "section-md": "3rem",
        "section-lg": "4rem",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "720px",
            fontSize: "1.0625rem",
            lineHeight: "1.85",
            color: "var(--text-primary)",
            h2: {
              marginTop: "3rem",
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "var(--text-primary)",
            },
            h3: {
              marginTop: "2rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "var(--text-primary)",
            },
            a: {
              color: "var(--brand-primary)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            },
            blockquote: {
              borderLeftColor: "var(--brand-primary)",
              borderLeftWidth: "3px",
              fontStyle: "italic",
              color: "var(--text-secondary)",
            },
            code: {
              backgroundColor: "var(--bg-tertiary)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "400",
              fontSize: "0.875em",
            },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
            pre: {
              backgroundColor: "var(--code-bg)",
              borderRadius: "8px",
              padding: "1.25rem",
            },
            img: {
              borderRadius: "8px",
            },
            strong: {
              color: "var(--text-primary)",
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
