import "server-only";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { ActionResponse } from "@/types";
import {
  collectManagedSiteImagePublicIds,
  deleteManagedSiteImage,
} from "@/features/image-upload/cloudinary";
import { parseSettingsDoc, parseSiteImageSlides } from "@/utils/parsers";
import { SITE_IMAGES_DRAFT_DOCUMENT_ID } from "./constants";
import {
  resolveDraftSiteImageSlides,
  resolvePublishedSiteImageSlides,
} from "./data";
import { saveSiteImagesSchema } from "./schemas";
import {
  SETTINGS_ERRORS,
  type PublishSiteImagesResult,
  type SaveSiteImagesInput,
  type SettingsErrorCode,
  type SiteImagesCleanupStatus,
} from "./types";

type SerializedSiteImageSlide = {
  id: string;
  image?: SaveSiteImagesInput["heroSlides"][number]["image"];
  imageUrl?: string;
  altText: string;
  order: number;
};

export type PreparedSiteImagesPublish = {
  shouldPublish: boolean;
  heroSlides: SerializedSiteImageSlide[];
  whyUsSlides: SerializedSiteImageSlide[];
  servicesSlides: SerializedSiteImageSlide[];
  cleanupCandidates: string[];
};

/**
 * Serializes validated slides into their canonical published representation.
 *
 * @param slides - Validated draft slide group
 * @returns Firestore-safe slides with canonical ordering
 */
const serializeSlides = (
  slides: SaveSiteImagesInput["heroSlides"],
): SerializedSiteImageSlide[] =>
  slides.map((slide, index) => ({
    id: slide.id,
    ...(slide.image ? { image: slide.image } : {}),
    ...(slide.imageUrl ? { imageUrl: slide.imageUrl } : {}),
    altText: slide.altText,
    order: index,
  }));

/**
 * Reads and validates the site-image draft without Firestore or Cloudinary
 * mutation, and computes potential stale-image cleanup candidates.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @returns Prepared canonical slides and cleanup candidates
 */
export const prepareSiteImagesDraftPublish = async (
  db: Firestore,
): Promise<ActionResponse<PreparedSiteImagesPublish, SettingsErrorCode>> => {
  try {
    const settingsCollection = db.collection("settings");
    const [generalSnap, heroSnap, draftSnap] = await Promise.all([
      settingsCollection.doc("general").get(),
      settingsCollection.doc("heroSlider").get(),
      settingsCollection.doc(SITE_IMAGES_DRAFT_DOCUMENT_ID).get(),
    ]);

    if (!draftSnap.exists) {
      return {
        success: true,
        data: {
          shouldPublish: false,
          heroSlides: [],
          whyUsSlides: [],
          servicesSlides: [],
          cleanupCandidates: [],
        },
      };
    }

    const settings = parseSettingsDoc(generalSnap.data());
    const generalData = generalSnap.data();
    const publishedHeroSlides = parseSiteImageSlides(heroSnap.data()?.slides);
    const publishedWhyUsSlides = resolvePublishedSiteImageSlides(
      generalData?.whyUsSlides,
      settings.whyUsImage,
    );
    const publishedServicesSlides = resolvePublishedSiteImageSlides(
      generalData?.servicesSlides,
      settings.servicesImage,
    );
    const draftData = draftSnap.data();
    const parsedDraft = saveSiteImagesSchema.safeParse({
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
    });
    if (!parsedDraft.success) {
      return { success: false, error: SETTINGS_ERRORS.VALIDATION_FAILED };
    }

    const heroSlides = serializeSlides(parsedDraft.data.heroSlides);
    const whyUsSlides = serializeSlides(parsedDraft.data.whyUsSlides);
    const servicesSlides = serializeSlides(parsedDraft.data.servicesSlides);
    const previousPublishedPublicIds = new Set<string>([
      ...collectManagedSiteImagePublicIds(heroSnap.data()),
      ...collectManagedSiteImagePublicIds(generalSnap.data()),
    ]);
    const nextPublishedPublicIds = new Set<string>([
      ...collectManagedSiteImagePublicIds({ slides: heroSlides }),
      ...collectManagedSiteImagePublicIds({
        whyUsSlides,
        servicesSlides,
      }),
    ]);

    return {
      success: true,
      data: {
        shouldPublish: true,
        heroSlides,
        whyUsSlides,
        servicesSlides,
        cleanupCandidates: [...previousPublishedPublicIds].filter(
          (publicId) => !nextPublishedPublicIds.has(publicId),
        ),
      },
    };
  } catch {
    console.error("Failed to prepare site images publish");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};

/**
 * Commits prepared site images without starting Cloudinary cleanup.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @param prepared - Validated canonical site-image publish state
 * @returns Whether site images were published
 */
export const commitSiteImagesPublish = async (
  db: Firestore,
  prepared: PreparedSiteImagesPublish,
): Promise<ActionResponse<PublishSiteImagesResult, SettingsErrorCode>> => {
  if (!prepared.shouldPublish) {
    return {
      success: true,
      data: { published: false, cleanupStatus: "not-needed" },
    };
  }

  try {
    const settingsCollection = db.collection("settings");
    const batch = db.batch();
    batch.set(
      settingsCollection.doc("heroSlider"),
      { slides: prepared.heroSlides },
      { merge: true },
    );
    batch.set(
      settingsCollection.doc("general"),
      {
        whyUsSlides: prepared.whyUsSlides,
        servicesSlides: prepared.servicesSlides,
        whyUsImage: FieldValue.delete(),
        servicesImage: FieldValue.delete(),
      },
      { merge: true },
    );
    await batch.commit();
    return {
      success: true,
      data: { published: true, cleanupStatus: "not-needed" },
    };
  } catch {
    console.error("Failed to publish site images");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};

/**
 * Rechecks every settings reference after cache invalidation, then removes
 * only unreferenced assets from managed Cloudinary folders.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @param cleanupCandidates - Potential stale public IDs from prepare phase
 * @returns Best-effort cleanup status without rolling back a publish
 */
export const cleanupPublishedSiteImages = async (
  db: Firestore,
  cleanupCandidates: readonly string[],
): Promise<SiteImagesCleanupStatus> => {
  const uniqueCandidates = [...new Set(cleanupCandidates)];
  if (uniqueCandidates.length === 0) return "not-needed";

  try {
    const currentSettingsSnapshot = await db.collection("settings").get();
    const referencedPublicIds = new Set<string>();
    currentSettingsSnapshot.docs.forEach((doc) => {
      collectManagedSiteImagePublicIds(doc.data()).forEach((publicId) =>
        referencedPublicIds.add(publicId),
      );
    });
    const orphanedPublicIds = uniqueCandidates.filter(
      (publicId) => !referencedPublicIds.has(publicId),
    );
    if (orphanedPublicIds.length === 0) return "not-needed";

    const cleanupResults = await Promise.all(
      orphanedPublicIds.map(deleteManagedSiteImage),
    );
    return cleanupResults.every(Boolean) ? "success" : "partial-failure";
  } catch {
    console.error("Failed to verify stale site image references");
    return "partial-failure";
  }
};
