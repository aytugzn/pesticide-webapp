import type { PestDoc, RegionDoc, SettingsDoc } from "@/types";

/**
 * Parses and validates raw Firestore data into a SettingsDoc.
 * 
 * @param data - Raw data from Firestore
 * @returns Type-safe SettingsDoc object
 */
export function parseSettingsDoc(data: unknown): SettingsDoc {
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
export function parsePestDoc(data: unknown): PestDoc {
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
export function parseRegionDoc(data: unknown): RegionDoc {
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
