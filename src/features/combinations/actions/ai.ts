"use server";

import "server-only";

import { requireAdmin } from "@/features/auth/requireAdmin";
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
  if (!(await requireAdmin())) {
    return { success: false, error: COMBINATION_ERRORS.UNAUTHORIZED };
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
