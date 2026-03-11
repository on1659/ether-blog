-- Analytics → DailyAnalytics 데이터 마이그레이션
-- prisma db push 실행 후, 기존 데이터가 있다면 이 SQL을 실행

-- 1. 기존 Analytics 데이터를 일별 집계로 변환
INSERT INTO "DailyAnalytics" (id, "postId", date, views)
SELECT
  gen_random_uuid()::text,
  "postId",
  DATE("createdAt"),
  COUNT(*)
FROM "Analytics"
GROUP BY "postId", DATE("createdAt")
ON CONFLICT ("postId", date) DO UPDATE SET views = EXCLUDED.views;

-- 2. Post.viewCount를 기존 Analytics 데이터 기반으로 초기화
UPDATE "Post" p
SET "viewCount" = COALESCE((
  SELECT COUNT(*) FROM "Analytics" a WHERE a."postId" = p.id
), 0);

-- 3. 마이그레이션 확인 후 기존 테이블 삭제
-- DROP TABLE "Analytics";
