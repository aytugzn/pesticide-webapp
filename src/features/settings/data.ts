import "server-only";

import {
  getAdminDb,
  hasFirebaseAdminConfig,
} from "@/lib/firebase-admin";
import {
  getLocalGlobalDataFallback,
  getLocalSettingsFallback,
  getPublicSnapshotResolution,
  getVisibleGlobalData,
} from "@/lib/publicSnapshot";
import { getPublishedSnapshotFromFirestoreOrThrow } from "@/lib/firestorePublishedSnapshot";
import {
  parsePestDoc,
  parseRegionDoc,
  parseSettingsDoc,
  parseSiteImageSlideDoc,
  parseSiteImageSlides,
} from "@/utils/parsers";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import type {
  AppImage,
  PublicDataResult,
  SettingsDoc,
  SiteImageSlideDoc,
} from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { DICTIONARY } from "@/constants/dictionary";
import {
  DEFAULT_PHONE,
  HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK,
} from "@/constants/ui";
import {
  GENERAL_SETTINGS_DRAFT_DOCUMENT_ID,
  SITE_IMAGES_DRAFT_DOCUMENT_ID,
} from "./constants";
import { generalSettingsDraftSchema } from "./schemas";
import { formatTurkishPhoneDisplay } from "@/utils/phone";
import type {
  AdminGeneralSettingsData,
  GeneralSettingsDraftData,
  GeneralSettingsFormValues,
  GlobalData,
  SiteImagesData,
} from "./types";

/**
 * Converts validated general settings into serializable form values.
 *
 * @param settings - Published settings with safe parser fallbacks
 * @param draft - Optional validated draft, including intentional empty values
 * @returns Flat string values consumed by the client form
 */
const createGeneralSettingsFormValues = (
  settings: ReturnType<typeof parseSettingsDoc>,
  draft?: GeneralSettingsDraftData,
): GeneralSettingsFormValues => ({
  phone: formatTurkishPhoneDisplay(
    draft?.phone ?? settings.phone ?? DEFAULT_PHONE,
  ),
  email:
    draft?.email ?? settings.email ?? DICTIONARY.footer.contact.email,
  address:
    draft?.address ?? settings.address ?? DICTIONARY.global.contact.address,
  workingHours:
    draft?.workingHours ??
    settings.workingHours ??
    DICTIONARY.global.contact.workingHours,
  instagramUrl:
    draft?.instagramUrl ??
    settings.instagramUrl ??
    DICTIONARY.social.instagram.url,
  facebookUrl:
    draft?.facebookUrl ??
    settings.facebookUrl ??
    DICTIONARY.social.facebook.url,
  googlePlaceId: draft?.googlePlaceId ?? settings.googlePlaceId ?? "",
  heroAutoplayDelay: String(
    draft?.heroAutoplayDelay ??
      settings.heroAutoplayDelay ??
      HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  ),
  servicesAutoplayDelay: String(
    draft?.servicesAutoplayDelay ??
      settings.servicesAutoplayDelay ??
      SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  ),
  whyUsAutoplayDelay: String(
    draft?.whyUsAutoplayDelay ??
      settings.whyUsAutoplayDelay ??
      WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  ),
  reviewsAutoplayDelay: String(
    draft?.reviewsAutoplayDelay ??
      settings.reviewsAutoplayDelay ??
      REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  ),
});

/**
 * Uses a valid draft group when present, while falling back to published data
 * for missing or wholly invalid legacy groups.
 *
 * @param rawDraftSlides - Raw group stored in the draft document
 * @param publishedSlides - Safe published fallback
 * @returns Slides to show in the admin editor or publish
 */
export const resolveDraftSiteImageSlides = (
  rawDraftSlides: unknown,
  publishedSlides: SiteImageSlideDoc[],
): SiteImageSlideDoc[] => {
  if (!Array.isArray(rawDraftSlides)) return publishedSlides;

  const parsedSlides = parseSiteImageSlides(rawDraftSlides);
  return rawDraftSlides.length > 0 && parsedSlides.length === 0
    ? publishedSlides
    : parsedSlides;
};

/**
 * Resolves published section slides without treating an intentionally empty
 * canonical array as missing. Legacy singleton data is used only when the
 * canonical field does not exist.
 *
 * @param rawCanonicalSlides - Raw canonical field, including an explicit empty array
 * @param legacyImage - Parsed legacy singleton image
 * @returns Canonical slides or a single legacy-compatible canonical slide
 */
export const resolvePublishedSiteImageSlides = (
  rawCanonicalSlides: unknown,
  legacyImage: AppImage | undefined,
): SiteImageSlideDoc[] => {
  if (Array.isArray(rawCanonicalSlides)) {
    const canonicalSlides = parseSiteImageSlides(rawCanonicalSlides);
    if (rawCanonicalSlides.length === 0 || canonicalSlides.length > 0) {
      return canonicalSlides;
    }
  }

  const legacySlide = legacyImage
    ? parseSiteImageSlideDoc(legacyImage, 0)
    : null;
  return legacySlide ? [legacySlide] : [];
};

/**
 * Loads the draft site-image editor state without creating a Firestore draft.
 * Published documents remain the fallback until the first explicit save.
 *
 * @returns Canonical slide groups, or null when authorization fails
 */
export const getAdminSiteImagesData = async (): Promise<
  SiteImagesData | null
> => {
  if (!(await requireAdmin())) return null;

  const db = getAdminDb();
  const [generalSnap, heroSnap, draftSnap] = await Promise.all([
    db.collection("settings").doc("general").get(),
    db.collection("settings").doc("heroSlider").get(),
    db.collection("settings").doc(SITE_IMAGES_DRAFT_DOCUMENT_ID).get(),
  ]);
  const settings = parseSettingsDoc(generalSnap.data());
  const generalData = generalSnap.data();
  const heroData = heroSnap.data();
  const publishedHeroSlides = parseSiteImageSlides(heroData?.slides);
  const publishedWhyUsSlides = resolvePublishedSiteImageSlides(
    generalData?.whyUsSlides,
    settings.whyUsImage,
  );
  const publishedServicesSlides = resolvePublishedSiteImageSlides(
    generalData?.servicesSlides,
    settings.servicesImage,
  );

  if (!draftSnap.exists) {
    return {
      heroSlides: publishedHeroSlides,
      whyUsSlides: publishedWhyUsSlides,
      servicesSlides: publishedServicesSlides,
    };
  }

  const draftData = draftSnap.data();
  return {
    heroSlides: resolveDraftSiteImageSlides(
      draftData?.heroSlides,
      publishedHeroSlides,
    ),
    whyUsSlides: resolveDraftSiteImageSlides(
      draftData?.whyUsSlides,
      publishedWhyUsSlides,
    ),
    servicesSlides: resolveDraftSiteImageSlides(
      draftData?.servicesSlides,
      publishedServicesSlides,
    ),
  };
};

/**
 * Loads the private general-settings editor state after server-side admin
 * authorization. The published document is used without creating a draft
 * when no valid draft exists.
 *
 * @returns Serializable form values, or null when authorization fails
 */
export const getAdminGeneralSettingsData = async (): Promise<
  AdminGeneralSettingsData | null
> => {
  if (!(await requireAdmin())) return null;

  const db = getAdminDb();
  const [publishedSnap, draftSnap] = await Promise.all([
    db.collection("settings").doc("general").get(),
    db
      .collection("settings")
      .doc(GENERAL_SETTINGS_DRAFT_DOCUMENT_ID)
      .get(),
  ]);
  const settings = parseSettingsDoc(publishedSnap.data());

  if (!draftSnap.exists) {
    return {
      values: createGeneralSettingsFormValues(settings),
    };
  }

  const parsedDraft = generalSettingsDraftSchema.safeParse(draftSnap.data());
  return {
    values: createGeneralSettingsFormValues(
      settings,
      parsedDraft.success ? parsedDraft.data : undefined,
    ),
  };
};

/**
 * Loads settings from the authoritative Firestore published envelope.
 * Server helpers reuse this result instead of issuing request-scoped reads.
 *
 * @returns Parsed published settings from the layout-settings cache
 */
export const getPublicSettingsFromFirestore = async (): Promise<SettingsDoc> => {
  "use cache";
  cacheLife("max");
  cacheTag("layout-settings");

  const snapshot = await getPublishedSnapshotFromFirestoreOrThrow();
  return snapshot.data.globalData.settings;
};

/**
 * Resolves public settings without retaining Redis or local fallbacks in the
 * long-lived primary Next.js cache.
 *
 * @returns Firestore settings, the last-known-good settings, or local defaults
 */
export const getPublicSettings = async (): Promise<SettingsDoc> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return await getPublicSettingsFromFirestore();
    } catch {
      console.warn("Failed to fetch public settings");
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  return snapshot.status === "available"
    ? snapshot.snapshot.data.globalData.settings
    : getLocalSettingsFallback();
};

/** Resolves metadata settings through the same published provider chain. */
export const getPublicSettingsForMetadata = async (): Promise<SettingsDoc> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return await getPublicSettingsFromFirestore();
    } catch {
      console.warn("Failed to fetch public metadata settings");
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  return snapshot.status === "available"
    ? snapshot.snapshot.data.globalData.settings
    : getLocalSettingsFallback();
};

/**
 * Fetches globally shared data from the Firestore published envelope.
 *
 * @returns Active pests, active regions, and general settings.
 */
export const getGlobalDataFromFirestore = async (): Promise<GlobalData> => {
  "use cache";
  cacheLife("max");
  cacheTag("global-data");

  return getVisibleGlobalData(
    await getPublishedSnapshotFromFirestoreOrThrow(),
  );
};

/** Loads editable canonical entities for authenticated admin-only consumers. */
export const getEditableGlobalData = async (): Promise<GlobalData> => {
  const [pestsSnap, regionsSnap, settingsSnap] = await Promise.all([
    getAdminDb().collection("pests").get(),
    getAdminDb().collection("regions").get(),
    getAdminDb().collection("settings").doc("general").get(),
  ]);
  return {
    pests: pestsSnap.docs.map((document) => parsePestDoc(document.data())),
    regions: regionsSnap.docs.map((document) =>
      parseRegionDoc(document.data()),
    ),
    settings: parseSettingsDoc(settingsSnap.data()),
  };
};

/**
 * Resolves authoritative global public data without manufacturing entities.
 *
 * @returns Found Firestore/snapshot data or temporary provider unavailability
 */
export const getGlobalDataResult = async (): Promise<
  PublicDataResult<GlobalData>
> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return { status: "found", data: await getGlobalDataFromFirestore() };
    } catch {
      console.warn("Failed to fetch global data");
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  return snapshot.status === "available"
    ? { status: "found", data: getVisibleGlobalData(snapshot.snapshot) }
    : { status: "temporarily-unavailable" };
};

/** Resolves metadata through Firestore published state and request-deduped Redis. */
export const getGlobalDataMetadataResult = async (): Promise<
  PublicDataResult<GlobalData>
> => {
  await connection();
  if (hasFirebaseAdminConfig()) {
    try {
      return { status: "found", data: await getGlobalDataFromFirestore() };
    } catch {
      console.warn("Failed to fetch global metadata");
    }
  }
  const snapshot = await getPublicSnapshotResolution();
  return snapshot.status === "available"
    ? { status: "found", data: getVisibleGlobalData(snapshot.snapshot) }
    : { status: "temporarily-unavailable" };
};

/** Resolves render-safe global data for non-entity public surfaces. */
export const getGlobalData = async (): Promise<GlobalData> => {
  const result = await getGlobalDataResult();
  return result.status === "found"
    ? result.data
    : getLocalGlobalDataFallback();
};
