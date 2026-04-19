import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** 다음 숫자 slug 반환 (DB에서 숫자 slug 중 최대값 + 1) */
export const nextSlug = async (): Promise<string> => {
  const result = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(slug AS INTEGER)) as max FROM "Post" WHERE slug ~ '^[0-9]+$'
  `;
  const max = result[0]?.max ?? 0;
  return String(max + 1);
};

/**
 * slug unique constraint 충돌(P2002) 시 nextSlug를 다시 뽑아 최대 3회 재시도.
 * 동시 파이프라인이 같은 번호를 채점하는 race condition 방어용.
 */
export const createPostWithSlug = async (
  data: Parameters<typeof prisma.post.create>[0]["data"]
): Promise<Awaited<ReturnType<typeof prisma.post.create>>> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.post.create({ data });
    } catch (e: unknown) {
      const isPrismaError = (err: unknown): err is { code: string } =>
        typeof err === "object" && err !== null && "code" in err;
      if (isPrismaError(e) && e.code === "P2002" && attempt < 2) {
        data = { ...data, slug: await nextSlug() };
        continue;
      }
      throw e;
    }
  }
  throw new Error("createPostWithSlug: max retries exceeded");
};
