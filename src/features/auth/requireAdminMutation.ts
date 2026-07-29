import "server-only";

import type { MutationPolicyErrorCode } from "@/constants/mutationPolicy";
import { getMutationPolicyFailure } from "@/lib/mutationPolicy";
import { requireAdmin } from "@/features/auth/requireAdmin";

type AdminMutationFailure<TUnauthorized extends string> = {
  success: false;
  error: TUnauthorized | MutationPolicyErrorCode;
  message?: string;
};

/**
 * Authenticates first, then enforces the fail-closed mutation policy.
 * Read-only loaders must call requireAdmin directly.
 */
export const requireAdminMutation = async <TUnauthorized extends string>(
  operation: string,
  unauthorizedError: TUnauthorized,
): Promise<AdminMutationFailure<TUnauthorized> | null> => {
  if (!(await requireAdmin())) {
    return { success: false, error: unauthorizedError };
  }

  return getMutationPolicyFailure(operation);
};
