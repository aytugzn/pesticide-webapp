import { MUTATION_POLICY_ERROR } from "@/constants/mutationPolicy";

export const IMAGE_UPLOAD_ERRORS = {
  [MUTATION_POLICY_ERROR]: MUTATION_POLICY_ERROR,
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  FILE_REQUIRED: "FILE_REQUIRED",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  CONFIGURATION_FAILED: "CONFIGURATION_FAILED",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const;

export type ImageUploadErrorCode = keyof typeof IMAGE_UPLOAD_ERRORS;

export type AdminImageCleanupStatus =
  | "not-needed"
  | "success"
  | "partial-failure";

export type AdminImageCleanupResult = {
  status: AdminImageCleanupStatus;
};
