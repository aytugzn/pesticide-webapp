import "server-only";

import {
  MUTATION_POLICY_ERROR,
  MUTATION_POLICY_MESSAGE,
} from "@/constants/mutationPolicy";
import {
  assertMutationAllowed,
  evaluateMutationPolicy,
  getMutationRuntime,
  MUTATION_ALLOW_ENV_NAME,
} from "@/lib/mutationPolicyCore";

/** Returns a client-safe action failure before any provider write starts. */
export const getMutationPolicyFailure = (
  operation: string,
): {
  success: false;
  error: typeof MUTATION_POLICY_ERROR;
  message: string;
} | null => {
  const decision = evaluateMutationPolicy();
  if (decision.allowed) return null;

  console.warn("Mutation blocked by environment policy", {
    operation,
    reason: decision.reason,
    runtime: decision.runtime,
  });
  return {
    success: false,
    error: MUTATION_POLICY_ERROR,
    message: MUTATION_POLICY_MESSAGE,
  };
};

export {
  assertMutationAllowed,
  evaluateMutationPolicy,
  getMutationRuntime,
  MUTATION_ALLOW_ENV_NAME,
};
