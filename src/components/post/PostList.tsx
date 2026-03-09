import { PostItem } from "./PostItem";
import type { PostMeta } from "@/types";

export const PostList = ({ posts }: { posts: PostMeta[] }) => {
  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-container px-8 py-16 text-center text-text-tertiary">
        아직 게시물이 없습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-container flex-col gap-px px-8 pb-16 pt-6">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
};
