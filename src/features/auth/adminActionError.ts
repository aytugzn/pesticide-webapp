import {
  MUTATION_POLICY_ERROR,
  MUTATION_POLICY_MESSAGE,
} from "@/constants/mutationPolicy";

type AdminActionFailure = {
  error: unknown;
  message?: unknown;
};

/**
 * Maps a server action failure to a client-safe admin message.
 *
 * Only the controlled mutation-policy code/message crosses this boundary.
 * Feature-specific failures keep their caller-provided fallback text.
 */
export const resolveAdminActionError = (
  failure: AdminActionFailure,
  fallbackMessage: string,
): string => {
  if (failure.error !== MUTATION_POLICY_ERROR) return fallbackMessage;

  return failure.message === MUTATION_POLICY_MESSAGE
    ? failure.message
    : MUTATION_POLICY_MESSAGE;
};
