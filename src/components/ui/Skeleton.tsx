export const Skeleton = ({
  className = "",
}: {
  className?: string;
}) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-bg-tertiary ${className}`}
    />
  );
};

export const PostSkeleton = () => {
  return (
    <div className="flex gap-7 border-b border-border-light py-7">
      <Skeleton className="h-[130px] w-[200px] flex-shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col justify-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
};
