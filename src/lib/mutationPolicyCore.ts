import { MUTATION_POLICY_MESSAGE } from "@/constants/mutationPolicy";
import { AppError } from "@/lib/exceptions";

export const MUTATION_ALLOW_ENV_NAME = "DMR_ALLOW_MUTATIONS";

export type MutationRuntime =
  | "github-actions"
  | "local-development"
  | "unknown"
  | "unknown-production"
  | "vercel-development"
  | "vercel-preview"
  | "vercel-production";

export type MutationPolicyDecision = {
  allowed: boolean;
  runtime: MutationRuntime;
  reason: "explicitly-allowed" | "explicit-opt-in-required" | "preview-blocked";
};

type MutationEnvironment = Readonly<Record<string, string | undefined>>;

/** Resolves a non-secret runtime label without assuming non-Vercel means production. */
export const getMutationRuntime = (
  environment: MutationEnvironment = process.env,
): MutationRuntime => {
  const vercelEnvironment = environment.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnvironment === "production") return "vercel-production";
  if (vercelEnvironment === "preview") return "vercel-preview";
  if (vercelEnvironment === "development") return "vercel-development";
  if (environment.GITHUB_ACTIONS?.trim().toLowerCase() === "true") {
    return "github-actions";
  }
  if (
    environment.NODE_ENV === "development" ||
    environment.NODE_ENV === "test"
  ) {
    return "local-development";
  }
  if (environment.NODE_ENV === "production") return "unknown-production";
  return "unknown";
};

/**
 * Evaluates the fail-safe mutation policy.
 *
 * Vercel Preview is always read-only. Every other runtime requires an explicit
 * server-only opt-in so local or CI processes cannot silently mutate production.
 */
export const evaluateMutationPolicy = (
  environment: MutationEnvironment = process.env,
): MutationPolicyDecision => {
  const runtime = getMutationRuntime(environment);
  if (runtime === "vercel-preview") {
    return { allowed: false, runtime, reason: "preview-blocked" };
  }

  const explicitlyAllowed =
    environment[MUTATION_ALLOW_ENV_NAME]?.trim().toLowerCase() === "true";
  return explicitlyAllowed
    ? { allowed: true, runtime, reason: "explicitly-allowed" }
    : { allowed: false, runtime, reason: "explicit-opt-in-required" };
};

/** Throws before a provider write begins when mutation is not permitted. */
export const assertMutationAllowed = (
  operation: string,
  environment: MutationEnvironment = process.env,
): void => {
  const decision = evaluateMutationPolicy(environment);
  if (decision.allowed) return;

  throw new AppError(MUTATION_POLICY_MESSAGE, "MUTATION_NOT_ALLOWED", {
    operation,
    reason: decision.reason,
    runtime: decision.runtime,
  });
};
