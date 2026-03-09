import { prisma } from "./prisma";
import { getCommitDetail } from "./github";
import { generateBlogContent } from "./claude";
import { calculateReadingTime } from "./markdown";

interface CommitData {
  id: string;
  message: string;
  timestamp?: string;
  added?: string[];
  removed?: string[];
  modified?: string[];
}

interface RepoData {
  owner: { login: string };
  name: string;
  full_name: string;
}

export const parseWebhookPayload = (body: Record<string, unknown>) => {
  const repository = body.repository as RepoData;
  const ref = body.ref as string;
  const commits = (body.commits || []) as CommitData[];

  const branch = ref?.replace("refs/heads/", "") || "main";

  return { repository, branch, commits };
};

export const processCommits = async (
  commits: CommitData[],
  repository: RepoData
) => {
  const owner = repository.owner.login;
  const repo = repository.name;

  // 감시 중인 레포인지 확인
  const watchedRepo = await prisma.watchedRepo.findUnique({
    where: { owner_name: { owner, name: repo } },
  });

  if (!watchedRepo?.active) {
    console.log(`Repo ${repository.full_name} is not being watched. Skipping.`);
    return { processed: 0, skipped: true };
  }

  let processed = 0;

  for (const commit of commits) {
    // typo fix 등 사소한 커밋은 스킵
    const trivialPatterns = /^(chore|style|docs|fix typo|formatting|lint)/i;
    if (trivialPatterns.test(commit.message) && commit.message.length < 30) {
      console.log(`Skipping trivial commit: ${commit.id.slice(0, 7)}`);
      continue;
    }

    try {
      const detail = await getCommitDetail(owner, repo, commit.id);

      // 파일별 patch 앞 500자만 추출 (토큰 절약)
      const filesSummary = detail.files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch?.slice(0, 500),
      }));

      const { title, content, tags } = await generateBlogContent({
        commitMessage: detail.message,
        diff: "",
        repoName: repo,
        filesChanged: filesSummary,
        customPrompt: watchedRepo.promptTemplate || undefined,
      });

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 100);

      const readingTime = calculateReadingTime(content);
      const excerpt = content.replace(/[#*`>\[\]]/g, "").slice(0, 200);

      await prisma.post.create({
        data: {
          title,
          content,
          excerpt,
          slug: `${slug}-${commit.id.slice(0, 7)}`,
          category: "commits",
          tags,
          readingTime,
          published: watchedRepo.autoPublish,
          commitHash: commit.id,
          commitUrl: detail.url,
          repoName: repo,
          projectSlug: repo.toLowerCase(),
          filesChanged: detail.files.length,
        },
      });

      processed++;
      console.log(`Generated post for commit ${commit.id.slice(0, 7)}`);
    } catch (error) {
      console.error(`Failed to process commit ${commit.id}:`, error);
    }
  }

  return { processed, skipped: false };
};
