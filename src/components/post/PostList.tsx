import { PostItem } from "./PostItem";
import type { PostMeta } from "@/types";

interface PostListProps {
  posts: PostMeta[];
  bare?: boolean;
  locale?: string;
}

export const PostList = ({ posts, bare, locale = "ko" }: PostListProps) => {
  if (posts.length === 0) {
    return (
      <div className={bare ? "py-16 text-center text-text-tertiary" : "mx-auto max-w-container px-5 sm:px-8 py-16 text-center text-text-tertiary"}>
        {locale === "en" ? "No posts yet." : "아직 게시물이 없습니다."}
      </div>
    );
  }

  return (
    <div className={bare ? "flex flex-col gap-px" : "mx-auto flex max-w-container flex-col gap-px px-5 sm:px-8 pb-16 pt-6"}>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} locale={locale} />
      ))}
    </div>
  );
};
