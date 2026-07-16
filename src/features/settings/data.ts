import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { AppError } from "@/lib/exceptions";
import {
  parsePestDoc,
  parseRegionDoc,
  parseSettingsDoc,
  parseSiteImageSlideDoc,
  parseSiteImageSlides,
} from "@/utils/parsers";
import { cacheLife, cacheTag } from "next/cache";
import type { AppImage, SettingsDoc, SiteImageSlideDoc } from "@/types";
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
  phone: draft?.phone ?? settings.phone ?? DEFAULT_PHONE,
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
 * Loads published general settings through the shared public-layout cache.
 * Server helpers reuse this result instead of issuing request-scoped reads.
 *
 * @returns Parsed published settings from the layout-settings cache
 */
export const getPublicSettings = async (): Promise<SettingsDoc> => {
  "use cache";
  cacheLife("max");
  cacheTag("layout-settings");

  try {
    const settingsSnap = await getAdminDb()
      .collection("settings")
      .doc("general")
      .get();
    return parseSettingsDoc(settingsSnap.data());
  } catch {
    console.error("Failed to fetch public settings");
    throw new AppError("Failed to fetch public settings");
  }
};

/**
 * Fetches globally shared public data without importing admin auth guards.
 *
 * @returns Active pests, active regions, and general settings.
 */
export const getGlobalData = async (): Promise<GlobalData> => {
  "use cache";
  cacheLife("max");
  cacheTag("global-data");

  try {
    const [pestsSnap, regionsSnap, settingsSnap] = await Promise.all([
      getAdminDb().collection("pests").where("isActive", "==", true).get(),
      getAdminDb().collection("regions").where("isActive", "==", true).get(),
      getAdminDb().collection("settings").doc("general").get(),
    ]);

    return {
      pests: pestsSnap.docs.map((doc) => parsePestDoc(doc.data())),
      regions: regionsSnap.docs.map((doc) => parseRegionDoc(doc.data())),
      settings: parseSettingsDoc(settingsSnap.data()),
    };
  } catch {
    console.error("Failed to fetch global data");
    throw new AppError("Failed to fetch global data");
  }
};
