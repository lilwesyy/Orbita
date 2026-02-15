"use server";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { fetchAllDashboardData, fetchUserRepos, rerunWorkflow, dispatchWorkflow, fetchWorkflowJobs, fetchJobLog, fetchRepoContents, fetchFileContent } from "@/lib/github";
import type { GitHubDashboardData, GitHubRepo, GitHubWorkflowJob, GitHubRepoContent } from "@/types/github";

interface GitHubDashboardResult {
  data?: GitHubDashboardData;
  error?: string;
  needsReconnect?: boolean;
}

export async function fetchGitHubDashboard(
  projectId: string
): Promise<GitHubDashboardResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    const data = await fetchAllDashboardData(
      token,
      config.repoOwner,
      config.repoName
    );
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("401")) {
      return { error: "Token expired or revoked", needsReconnect: true };
    }
    return { error: message };
  }
}

interface RerunResult {
  success?: boolean;
  error?: string;
}

export async function rerunGitHubWorkflow(
  projectId: string,
  runId: number
): Promise<RerunResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    await rerunWorkflow(token, config.repoOwner, config.repoName, runId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

interface DispatchResult {
  success?: boolean;
  error?: string;
}

export async function dispatchGitHubWorkflow(
  projectId: string,
  workflowId: number,
  ref: string
): Promise<DispatchResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    await dispatchWorkflow(token, config.repoOwner, config.repoName, workflowId, ref);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

interface WorkflowJobsResult {
  jobs?: GitHubWorkflowJob[];
  error?: string;
}

export async function fetchGitHubWorkflowJobs(
  projectId: string,
  runId: number
): Promise<WorkflowJobsResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    const jobs = await fetchWorkflowJobs(token, config.repoOwner, config.repoName, runId);
    return { jobs };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

interface JobLogResult {
  log?: string;
  error?: string;
}

export async function fetchGitHubJobLog(
  projectId: string,
  jobId: number
): Promise<JobLogResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    const log = await fetchJobLog(token, config.repoOwner, config.repoName, jobId);
    return { log };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

interface RepoContentsResult {
  contents?: GitHubRepoContent[];
  error?: string;
}

export async function fetchGitHubRepoContents(
  projectId: string,
  path: string = ""
): Promise<RepoContentsResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    const contents = await fetchRepoContents(token, config.repoOwner, config.repoName, path);
    return { contents };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

interface FileContentResult {
  content?: string;
  error?: string;
}

export async function fetchGitHubFileContent(
  projectId: string,
  path: string
): Promise<FileContentResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config || !config.repoOwner || !config.repoName) {
    return { error: "No repository configured" };
  }

  try {
    const token = decrypt(config.accessToken);
    const content = await fetchFileContent(token, config.repoOwner, config.repoName, path);
    return { content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

interface GitHubReposResult {
  repos?: GitHubRepo[];
  error?: string;
  needsReconnect?: boolean;
}

export async function fetchGitHubRepos(
  projectId: string
): Promise<GitHubReposResult> {
  const config = await prisma.gitHubConfig.findUnique({
    where: { projectId },
  });

  if (!config) {
    return { error: "No GitHub configuration found" };
  }

  try {
    const token = decrypt(config.accessToken);
    const repos = await fetchUserRepos(token);
    return { repos };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("401")) {
      return { error: "Token expired or revoked", needsReconnect: true };
    }
    return { error: message };
  }
}
