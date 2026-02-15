import type {
  GitHubRepo,
  GitHubCommit,
  GitHubIssue,
  GitHubPullRequest,
  GitHubBranch,
  GitHubContributor,
  GitHubWeeklyCommitActivity,
  GitHubWorkflowRun,
  GitHubWorkflowJob,
  GitHubRepoContent,
  GitHubDashboardData,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

async function githubFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

export function fetchRepo(token: string, owner: string, repo: string) {
  return githubFetch<GitHubRepo>(token, `/repos/${owner}/${repo}`);
}

export function fetchCommits(token: string, owner: string, repo: string) {
  return githubFetch<GitHubCommit[]>(
    token,
    `/repos/${owner}/${repo}/commits?per_page=10`
  );
}

export function fetchIssues(token: string, owner: string, repo: string) {
  return githubFetch<GitHubIssue[]>(
    token,
    `/repos/${owner}/${repo}/issues?state=open&per_page=10`
  );
}

export function fetchPullRequests(
  token: string,
  owner: string,
  repo: string
) {
  return githubFetch<GitHubPullRequest[]>(
    token,
    `/repos/${owner}/${repo}/pulls?state=open&per_page=10`
  );
}

export function fetchBranches(token: string, owner: string, repo: string) {
  return githubFetch<GitHubBranch[]>(
    token,
    `/repos/${owner}/${repo}/branches?per_page=50`
  );
}

export function fetchContributors(
  token: string,
  owner: string,
  repo: string
) {
  return githubFetch<GitHubContributor[]>(
    token,
    `/repos/${owner}/${repo}/contributors?per_page=20`
  );
}

export async function fetchCommitActivity(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubWeeklyCommitActivity[]> {
  try {
    const data = await githubFetch<GitHubWeeklyCommitActivity[]>(
      token,
      `/repos/${owner}/${repo}/stats/commit_activity`
    );
    // GitHub may return 202 (computing) which triggers an error above
    // Return last 4 weeks
    return Array.isArray(data) ? data.slice(-4) : [];
  } catch {
    return [];
  }
}

export async function fetchWorkflowRuns(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubWorkflowRun[]> {
  try {
    const data = await githubFetch<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }>(
      token,
      `/repos/${owner}/${repo}/actions/runs?per_page=15`
    );
    return data.workflow_runs;
  } catch {
    return [];
  }
}

export async function rerunWorkflow(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}/rerun`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: rerun workflow ${runId}`);
  }
}

export async function dispatchWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowId: number,
  ref: string
): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref }),
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: dispatch workflow ${workflowId}`);
  }
}

export async function fetchWorkflowJobs(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubWorkflowJob[]> {
  const data = await githubFetch<{ total_count: number; jobs: GitHubWorkflowJob[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`
  );
  return data.jobs;
}

export async function fetchJobLog(
  token: string,
  owner: string,
  repo: string,
  jobId: number
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: fetch job log ${jobId}`);
  }

  return res.text();
}

export function fetchRepoContents(
  token: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<GitHubRepoContent[]> {
  const encodedPath = path ? `/${encodeURIComponent(path).replace(/%2F/g, "/")}` : "";
  return githubFetch<GitHubRepoContent[]>(
    token,
    `/repos/${owner}/${repo}/contents${encodedPath}`
  );
}

export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: fetch file ${path}`);
  }

  return res.text();
}

export function fetchUserRepos(token: string) {
  return githubFetch<GitHubRepo[]>(
    token,
    `/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`
  );
}

export async function fetchAllDashboardData(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubDashboardData> {
  const [repoData, commits, issues, pullRequests, branches, contributors, commitActivity, workflowRuns] =
    await Promise.all([
      fetchRepo(token, owner, repo),
      fetchCommits(token, owner, repo),
      fetchIssues(token, owner, repo),
      fetchPullRequests(token, owner, repo),
      fetchBranches(token, owner, repo),
      fetchContributors(token, owner, repo),
      fetchCommitActivity(token, owner, repo),
      fetchWorkflowRuns(token, owner, repo),
    ]);

  return {
    repo: repoData,
    commits,
    issues,
    pullRequests,
    branches,
    contributors,
    commitActivity,
    workflowRuns,
  };
}
