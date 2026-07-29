export const MUTATION_POLICY_ERROR = "MUTATION_NOT_ALLOWED" as const;

export const MUTATION_POLICY_MESSAGE =
  "Bu ortamda veri değişikliği güvenlik politikası tarafından engellendi.";

export type MutationPolicyErrorCode = typeof MUTATION_POLICY_ERROR;
