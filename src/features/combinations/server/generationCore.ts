import type { Firestore } from "firebase-admin/firestore";
import type { ActionResponse, CombinationDoc } from "@/types";
import {
  buildCombinationPrompt,
  getGeminiApiKeys,
  getGeminiModel,
} from "@/lib/geminiCore";
import {
  extractAndParseJson,
  parseCombinationDoc,
  parsePestDoc,
  parseRegionDoc,
} from "@/utils/parsers";
import {
  combinationSlugParamsSchema,
  generatedContentSchema,
  saveCombinationSchema,
} from "../schemas";
import {
  COMBINATION_ERRORS,
  type CombinationErrorCode,
  type GeneratedContent,
} from "../types";
import { getAiErrorReason, getErrorInfo } from "../actions/utils";

/**
 * Generates one region-pest content payload using the shared Gemini key rotation.
 *
 * @param db - Initialized Firebase Admin Firestore client
 * @param regionSlug - Region identifier
 * @param pestSlug - Pest identifier
 * @returns Validated generated content or a safe typed error
 */
export const generateCombinationContentCore = async (
  db: Firestore,
  regionSlug: string,
  pestSlug: string,
): Promise<ActionResponse<GeneratedContent, CombinationErrorCode>> => {
  const params = combinationSlugParamsSchema.safeParse({ regionSlug, pestSlug });
  if (!params.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const [regionSnap, pestSnap] = await Promise.all([
      db.collection("regions").doc(params.data.regionSlug).get(),
      db.collection("pests").doc(params.data.pestSlug).get(),
    ]);

    if (!regionSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.REGION_NOT_FOUND };
    }
    if (!pestSnap.exists) {
      return { success: false, error: COMBINATION_ERRORS.PEST_NOT_FOUND };
    }

    const region = parseRegionDoc(regionSnap.data());
    const pest = parsePestDoc(pestSnap.data());
    const prompt = buildCombinationPrompt(
      { name: region.name, description: region.description || "" },
      { name: pest.name, description: pest.description || "" },
    );
    const keys = getGeminiApiKeys();

    if (keys.length === 0) {
      console.error("Gemini credentials are missing");
      return {
        success: false,
        error: COMBINATION_ERRORS.AI_CREDENTIALS_MISSING,
      };
    }

    let sawQuotaError = false;
    let sawProviderUnavailable = false;
    let sawInvalidKey = false;

    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      try {
        const result = await getGeminiModel(keys[keyIndex]).generateContent(prompt);
        const responseText = result.response.text();
        if (!responseText) {
          return {
            success: false,
            error: COMBINATION_ERRORS.AI_GENERATION_FAILED,
          };
        }

        const generatedRaw = extractAndParseJson<GeneratedContent>(responseText);
        const validated = generatedContentSchema.safeParse(generatedRaw);
        if (!validated.success) {
          console.warn("Gemini response validation failed", {
            regionSlug,
            pestSlug,
            keyIndex,
          });
          return {
            success: false,
            error: COMBINATION_ERRORS.VALIDATION_FAILED,
          };
        }

        return { success: true, data: validated.data };
      } catch (error: unknown) {
        const reason = getAiErrorReason(getErrorInfo(error));
        if (reason === "quota_or_rate_limit") {
          sawQuotaError = true;
          console.warn("Gemini key quota unavailable", { keyIndex });
          continue;
        }
        if (reason === "provider_unavailable") {
          sawProviderUnavailable = true;
          console.warn("Gemini provider unavailable", { keyIndex });
          continue;
        }
        if (reason === "invalid_api_key") {
          sawInvalidKey = true;
          console.warn("Gemini key is invalid", { keyIndex });
          continue;
        }

        console.error("Gemini generation failed", {
          regionSlug,
          pestSlug,
          reason,
        });
        return {
          success: false,
          error: COMBINATION_ERRORS.AI_GENERATION_FAILED,
        };
      }
    }

    if (sawQuotaError) {
      return { success: false, error: COMBINATION_ERRORS.AI_QUOTA_EXCEEDED };
    }
    if (sawProviderUnavailable) {
      return {
        success: false,
        error: COMBINATION_ERRORS.AI_PROVIDER_UNAVAILABLE,
      };
    }
    if (sawInvalidKey) {
      return { success: false, error: COMBINATION_ERRORS.AI_INVALID_API_KEY };
    }

    return {
      success: false,
      error: COMBINATION_ERRORS.AI_GENERATION_FAILED,
    };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    console.error("Combination generation core failed", {
      regionSlug,
      pestSlug,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.AI_GENERATION_FAILED };
  }
};

/**
 * Checks whether a create-only combination target is missing, existing or archived.
 *
 * @param db - Initialized Firebase Admin Firestore client
 * @param regionSlug - Region identifier
 * @param pestSlug - Pest identifier
 * @returns Existing state or a safe read error
 */
export const inspectCombinationCreateState = async (
  db: Firestore,
  regionSlug: string,
  pestSlug: string,
): Promise<
  ActionResponse<"missing" | "existing", CombinationErrorCode>
> => {
  const parsed = combinationSlugParamsSchema.safeParse({ regionSlug, pestSlug });
  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  try {
    const document = await db
      .collection("combinations")
      .doc(`${parsed.data.regionSlug}_${parsed.data.pestSlug}`)
      .get();
    if (!document.exists) return { success: true, data: "missing" };
    if (parseCombinationDoc(document.data()).isArchived) {
      return { success: false, error: COMBINATION_ERRORS.ARCHIVED_EXISTS };
    }
    return { success: true, data: "existing" };
  } catch (error: unknown) {
    console.error("Combination state inspection failed", {
      regionSlug,
      pestSlug,
      errorCode: getErrorInfo(error).code,
    });
    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
  }
};

/**
 * Creates canonical combination content without publishing public snapshots.
 *
 * @param db - Initialized Firebase Admin Firestore client
 * @param input - Validated combination identity, content and active state
 * @returns Create result with duplicate and archive conflicts classified
 */
export const saveCombinationCore = async (
  db: Firestore,
  input: {
    regionSlug: string;
    pestSlug: string;
    regionName: string;
    pestName: string;
    content: GeneratedContent;
    isActive: boolean;
  },
): Promise<ActionResponse<void, CombinationErrorCode>> => {
  const parsed = saveCombinationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: COMBINATION_ERRORS.VALIDATION_FAILED };
  }

  const data = parsed.data;
  const docId = `${data.regionSlug}_${data.pestSlug}`;
  const docRef = db.collection("combinations").doc(docId);
  const docData: CombinationDoc = {
    region: data.regionSlug,
    pest: data.pestSlug,
    regionName: data.regionName,
    pestName: data.pestName,
    title: data.content.title,
    h1: data.content.h1,
    metaDesc: data.content.metaDesc,
    content: data.content.content,
    faq: data.content.faq,
    isActive: data.isActive,
  };

  try {
    const existing = await docRef.get();
    if (existing.exists) {
      return {
        success: false,
        error: parseCombinationDoc(existing.data()).isArchived
          ? COMBINATION_ERRORS.ARCHIVED_EXISTS
          : COMBINATION_ERRORS.ALREADY_EXISTS,
      };
    }

    await docRef.create(docData);
    return { success: true };
  } catch (error: unknown) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.code === "6" || errorInfo.message?.includes("ALREADY_EXISTS")) {
      try {
        const existing = await docRef.get();
        if (existing.exists && parseCombinationDoc(existing.data()).isArchived) {
          return { success: false, error: COMBINATION_ERRORS.ARCHIVED_EXISTS };
        }
      } catch (lookupError: unknown) {
        console.error("Combination duplicate lookup failed", {
          regionSlug: data.regionSlug,
          pestSlug: data.pestSlug,
          errorCode: getErrorInfo(lookupError).code,
        });
        return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
      }
      return { success: false, error: COMBINATION_ERRORS.ALREADY_EXISTS };
    }

    console.error("Combination create failed", {
      regionSlug: data.regionSlug,
      pestSlug: data.pestSlug,
      errorCode: errorInfo.code,
    });
    return { success: false, error: COMBINATION_ERRORS.SAVE_FAILED };
  }
};
