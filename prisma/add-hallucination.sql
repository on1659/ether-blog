-- Add hallucination category to enum + validation fields to Post
-- Run against production DB manually

-- 1. Add hallucination to Category enum
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'hallucination';

-- 2. Add validation fields to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "validationScore" INTEGER;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "validationIssues" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "validatedAt" TIMESTAMP(3);

-- 3. Add index on validationScore for filtering
CREATE INDEX IF NOT EXISTS "Post_validationScore_idx" ON "Post"("validationScore");
