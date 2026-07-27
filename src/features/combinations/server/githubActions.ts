import "server-only";

import { z } from "zod";
import { AppError } from "@/lib/exceptions";
import { COMBINATION_JOB_ERRORS } from "../types";

const GITHUB_API_VERSION = "2026-03-10";
const DISPATCH_TIMEOUT_MS = 10_000;

const githubDispatchResponseSchema = z.object({
  workflow_run_id: z.number().int().positive(),
  run_url: z.url(),
  html_url: z.url(),
});

const githubDispatchConfigSchema = z.object({
  token: z.string().trim().min(1),
  repository: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  ref: z.string().trim().min(1).max(255).regex(/^[A-Za-z0-9._/-]+$/),
  workflow: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9_.-]+\.ya?ml$/),
});

/** Validates server-only GitHub workflow dispatch configuration. */
const getGithubDispatchConfig = () => {
  const parsed = githubDispatchConfigSchema.safeParse({
    token: process.env.GITHUB_ACTIONS_TOKEN,
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_ACTIONS_REF,
    workflow: process.env.GITHUB_ACTIONS_WORKFLOW,
  });

  if (!parsed.success) {
    throw new AppError(
      COMBINATION_JOB_ERRORS.GITHUB_CONFIG_INVALID,
      COMBINATION_JOB_ERRORS.GITHUB_CONFIG_INVALID,
    );
  }

  return parsed.data;
};

/**
 * Dispatches the combination worker workflow through the GitHub REST API.
 *
 * @param jobId - Firestore job identifier passed as workflow input
 */
export const dispatchCombinationWorkflow = async (
  jobId: string,
): Promise<void> => {
  const config = getGithubDispatchConfig();
  const endpoint = `https://api.github.com/repos/${config.repository}/actions/workflows/${encodeURIComponent(config.workflow)}/dispatches`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      body: JSON.stringify({
        ref: config.ref,
        inputs: { jobId },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
    });

    if (response.status === 204) return;

    if (response.status === 200) {
      const responseBody: unknown = await response.json();
      if (githubDispatchResponseSchema.safeParse(responseBody).success) return;
    }

    if (response.status !== 200) {
      throw new AppError(
        COMBINATION_JOB_ERRORS.DISPATCH_FAILED,
        COMBINATION_JOB_ERRORS.DISPATCH_FAILED,
        { status: response.status },
      );
    }

    throw new AppError(
      COMBINATION_JOB_ERRORS.DISPATCH_FAILED,
      COMBINATION_JOB_ERRORS.DISPATCH_FAILED,
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      COMBINATION_JOB_ERRORS.DISPATCH_FAILED,
      COMBINATION_JOB_ERRORS.DISPATCH_FAILED,
    );
  }
};
