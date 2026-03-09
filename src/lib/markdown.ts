import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import type { ReactElement } from "react";

export const renderMarkdown = async (source: string): Promise<ReactElement> => {
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: "one-dark-pro",
              keepBackground: true,
            },
          ],
        ],
      },
    },
  });

  return content;
};

export const extractHeadings = (
  content: string
): { id: string; text: string; level: number }[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
};

export const calculateReadingTime = (content: string): number => {
  const charCount = content.replace(/\s/g, "").length;
  return Math.max(1, Math.ceil(charCount / 400));
};
