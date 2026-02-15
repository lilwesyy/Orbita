export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: GitHubUser;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: GitHubUser | null;
}

export interface GitHubLabel {
  name: string;
  color: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  comments: number;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  draft: boolean;
  head: { ref: string };
  base: { ref: string };
  labels: GitHubLabel[];
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubWeeklyCommitActivity {
  total: number;
  week: number;
  days: number[];
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_number: number;
  event: string;
  workflow_id: number;
  actor: GitHubUser;
}

export interface GitHubWorkflowJob {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  started_at: string | null;
  completed_at: string | null;
  steps: GitHubWorkflowStep[];
}

export interface GitHubWorkflowStep {
  name: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface GitHubRepoContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
  html_url: string;
  download_url: string | null;
}

export interface GitHubDashboardData {
  repo: GitHubRepo;
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
  branches: GitHubBranch[];
  contributors: GitHubContributor[];
  commitActivity: GitHubWeeklyCommitActivity[];
  workflowRuns: GitHubWorkflowRun[];
}

export interface GitHubConfigSerialized {
  id: string;
  projectId: string;
  repoOwner: string | null;
  repoName: string | null;
  repoFullName: string | null;
}
