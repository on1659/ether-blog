import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRepoWebhook } from "@/lib/github";
import type { ApiResponse } from "@/types";

// hookId 없는 레포 전체에 webhook 재설치
export const POST = async () => {
  const session = await auth();
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!session || !user?.isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.watchedRepo.findMany({
    where: { githubHookId: null, active: true },
  });

  const results: { name: string; hookId: number | null; error?: string }[] = [];

  for (const repo of repos) {
    try {
      const hookId = await createRepoWebhook(repo.owner, repo.name);
      await prisma.watchedRepo.update({
        where: { id: repo.id },
        data: { githubHookId: hookId },
      });
      results.push({ name: repo.name, hookId });
    } catch (err) {
      results.push({ name: repo.name, hookId: null, error: err instanceof Error ? err.message : "unknown" });
    }
  }

  const res: ApiResponse = {
    success: true,
    data: { results, total: repos.length, ok: results.filter((r) => r.hookId).length },
  };
  return NextResponse.json(res);
};
