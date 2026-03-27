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
