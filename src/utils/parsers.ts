import type { PestDoc, RegionDoc, SettingsDoc } from "@/types";
import { AppError } from "@/lib/exceptions";
import { DICTIONARY } from "@/constants/dictionary";

/**
 * Parses and validates raw Firestore data into a SettingsDoc.
 * 
 * @param data - Raw data from Firestore
 * @returns Type-safe SettingsDoc object
 */
export const parseSettingsDoc = (data: unknown): SettingsDoc => {
  if (!data || typeof data !== "object") return {};
  
  const d = data as Record<string, unknown>;
  return {
    phone: d.phone ? String(d.phone) : undefined,
    defaultOgImage: d.defaultOgImage ? String(d.defaultOgImage) : undefined,
    heroAutoplayDelay: d.heroAutoplayDelay ? Number(d.heroAutoplayDelay) : undefined,
    servicesAutoplayDelay: d.servicesAutoplayDelay ? Number(d.servicesAutoplayDelay) : undefined,
    reviewsAutoplayDelay: d.reviewsAutoplayDelay ? Number(d.reviewsAutoplayDelay) : undefined,
    googlePlaceId: d.googlePlaceId ? String(d.googlePlaceId) : undefined,
    instagramUrl: d.instagramUrl ? String(d.instagramUrl) : undefined,
    facebookUrl: d.facebookUrl ? String(d.facebookUrl) : undefined,
  };
}

/**
 * Parses and validates raw Firestore data into a PestDoc.
 * Ensures default values for required fields.
 * 
 * @param data - Raw data from Firestore
 * @returns Type-safe PestDoc object
 */
export const parsePestDoc = (data: unknown): PestDoc => {
  if (!data || typeof data !== "object") {
    return { name: "", slug: "", isActive: false };
  }
  
  const d = data as Record<string, unknown>;
  return {
    name: String(d.name || ""),
    slug: String(d.slug || ""),
    description: d.description ? String(d.description) : undefined,
    imageUrl: d.imageUrl ? String(d.imageUrl) : undefined,
    isActive: Boolean(d.isActive ?? false),
  };
}

/**
 * Parses and validates raw Firestore data into a RegionDoc.
 * Ensures default values for required fields.
 * 
 * @param data - Raw data from Firestore
 * @returns Type-safe RegionDoc object
 */
export const parseRegionDoc = (data: unknown): RegionDoc => {
  if (!data || typeof data !== "object") {
    return { name: "", slug: "", isActive: false };
  }
  
  const d = data as Record<string, unknown>;
  return {
    name: String(d.name || ""),
    slug: String(d.slug || ""),
    description: d.description ? String(d.description) : undefined,
    isActive: Boolean(d.isActive ?? false),
  };
}

/**
 * Robustly extracts and parses JSON from an AI text response.
 * Strips markdown code blocks and handles leading/trailing text.
 * 
 * @param text - The raw text response from the AI
 * @returns The parsed JSON object
 * @throws AppError if JSON extraction or parsing fails
 */
export const extractAndParseJson = <T = unknown,>(text: string): T => {
  try {
    // 1. Remove markdown code blocks if present (```json ... ```)
    let cleanText = text.replace(/```(?:json)?\n?/g, "").replace(/```\n?/g, "").trim();

    // 2. Try to find the first '{' or '[' and the last '}' or ']'
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
    }

    if (startIndex !== -1) {
      const isArray = cleanText[startIndex] === '[';
      const lastIndex = cleanText.lastIndexOf(isArray ? ']' : '}');
      
      if (lastIndex !== -1 && lastIndex >= startIndex) {
        cleanText = cleanText.substring(startIndex, lastIndex + 1);
      }
    }

    // 3. Parse the cleaned string
    return JSON.parse(cleanText) as T;
  } catch (error) {
    throw new AppError(`${DICTIONARY.systemErrors.jsonParseFailed}${text.substring(0, 100)}...`, "JSON_PARSE_ERROR");
  }
}
