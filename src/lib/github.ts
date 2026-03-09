import { Octokit } from "@octokit/rest";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const getCommitDetail = async (
  owner: string,
  repo: string,
  ref: string
) => {
  const { data } = await octokit.repos.getCommit({ owner, repo, ref });

  return {
    sha: data.sha,
    message: data.commit.message,
    url: data.html_url,
    author: data.commit.author?.name || "unknown",
    date: data.commit.author?.date || new Date().toISOString(),
    files: (data.files || []).map((f) => ({
      filename: f.filename,
      status: f.status || "modified",
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch?.slice(0, 500),
    })),
  };
};

export const getRepoInfo = async (owner: string, repo: string) => {
  const { data } = await octokit.repos.get({ owner, repo });
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    language: data.language,
    url: data.html_url,
  };
};
