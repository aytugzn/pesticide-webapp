"use server";

import "server-only";

import { requireAdminMutation } from "@/features/auth/requireAdminMutation";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionResponse } from "@/types";
import { combinationSlugParamsSchema } from "../schemas";
import { generateCombinationContentCore } from "../server/generationCore";
import {
  COMBINATION_ERRORS,
  type CombinationErrorCode,
  type GeneratedContent,
} from "../types";

/**
 * Generates validated combination content after enforcing the admin session.
 *
 * @param regionSlug - Region identifier
 * @param pestSlug - Pest identifier
 * @returns Generated content or a safe typed error
 */
export const generateCombinationContent = async (
  regionSlug: string,
  pestSlug: string,
): Promise<ActionResponse<GeneratedContent, CombinationErrorCode>> => {
  const guardFailure = await requireAdminMutation(
    "combination-generate-content",
    COMBINATION_ERRORS.UNAUTHORIZED,
  );
  if (guardFailure) {
    return guardFailure;
  }

  const parsed = combinationSlugParamsSchema.safeParse({
    regionSlug,
    pestSlug,
  });
  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  return generateCombinationContentCore(
    getAdminDb(),
    parsed.data.regionSlug,
    parsed.data.pestSlug,
  );
};
