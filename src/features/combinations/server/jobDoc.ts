import { combinationBulkJobDocSchema } from "../schemas";
import type { CombinationBulkJobDoc } from "../types";

/**
 * Parses an untrusted Firestore background-job document.
 *
 * @param value - Raw Firestore document data
 * @returns Valid job data or null when the document is malformed
 */
export const parseCombinationJobDoc = (
  value: unknown,
): CombinationBulkJobDoc | null => {
  const parsed = combinationBulkJobDocSchema.safeParse(value);
  if (!parsed.success) return null;

  return parsed.data;
};
