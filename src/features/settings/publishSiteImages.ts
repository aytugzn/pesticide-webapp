import "server-only";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  finalizePreparedDraft,
  getPreparedDraftVersionStatus,
  getFirestoreDocumentVersion,
  type DraftFinalizationStatus,
  type FirestoreDocumentVersion,
} from "@/lib/firestoreDraftFinalization";
import type { ActionResponse } from "@/types";
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
} from "./types";

type SerializedSiteImageSlide = {
  id: string;
  image?: SaveSiteImagesInput["heroSlides"][number]["image"];
  imageUrl?: string;
  altText: string;
  order: number;
};

export type PreparedSiteImagesPublish = {
  hasDraft: boolean;
  draftVersion: FirestoreDocumentVersion | null;
  shouldPublish: boolean;
  heroChanged: boolean;
  settingsSlidesChanged: boolean;
  heroSlides: SerializedSiteImageSlide[];
  whyUsSlides: SerializedSiteImageSlide[];
  servicesSlides: SerializedSiteImageSlide[];
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
 * mutation, and identifies which public cache responsibilities changed.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @returns Prepared canonical slides and per-group change state
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
          hasDraft: false,
          draftVersion: null,
          shouldPublish: false,
          heroChanged: false,
          settingsSlidesChanged: false,
          heroSlides: [],
          whyUsSlides: [],
          servicesSlides: [],
        },
      };
    }

    const settings = parseSettingsDoc(generalSnap.data());
    const draftVersion = getFirestoreDocumentVersion(draftSnap);
    if (!draftVersion) {
      console.error("Failed to read site images draft version");
      return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
    }
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
    const heroChanged =
      JSON.stringify(heroSlides) !==
      JSON.stringify(serializeSlides(publishedHeroSlides));
    const settingsSlidesChanged =
      JSON.stringify(whyUsSlides) !==
        JSON.stringify(serializeSlides(publishedWhyUsSlides)) ||
      JSON.stringify(servicesSlides) !==
        JSON.stringify(serializeSlides(publishedServicesSlides));
    const shouldPublish = heroChanged || settingsSlidesChanged;

    return {
      success: true,
      data: {
        hasDraft: true,
        draftVersion,
        shouldPublish,
        heroChanged,
        settingsSlidesChanged,
        heroSlides,
        whyUsSlides,
        servicesSlides,
      },
    };
  } catch {
    console.error("Failed to prepare site images publish");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};

/**
 * Removes a consumed site-image draft only after snapshot and cache activation.
 *
 * @param db - Authorized Admin Firestore instance
 * @returns Whether pending activation state was cleared
 */
export const finalizeSiteImagesPublish = async (
  db: Firestore,
  expectedVersion: FirestoreDocumentVersion | null,
): Promise<DraftFinalizationStatus> =>
  finalizePreparedDraft(
    db,
    db.collection("settings").doc(SITE_IMAGES_DRAFT_DOCUMENT_ID),
    expectedVersion,
  );

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
  try {
    const settingsCollection = db.collection("settings");
    const result = await db.runTransaction<PublishSiteImagesResult | null>(
      async (transaction) => {
        if (prepared.hasDraft) {
          const draftRef = settingsCollection.doc(
            SITE_IMAGES_DRAFT_DOCUMENT_ID,
          );
          const currentDraft = await transaction.get(draftRef);
          const versionStatus = getPreparedDraftVersionStatus(
            currentDraft,
            prepared.draftVersion,
          );
          if (versionStatus === "failed") return null;
          if (versionStatus !== "current") {
            return {
              published: false,
              status: versionStatus,
              cleanupStatus: "not-needed",
            };
          }
        }

        if (!prepared.shouldPublish) {
          return {
            published: false,
            status: "unchanged-current",
            cleanupStatus: "not-needed",
          };
        }

        if (prepared.heroChanged) {
          transaction.set(
            settingsCollection.doc("heroSlider"),
            { slides: prepared.heroSlides },
            { merge: true },
          );
        }
        if (prepared.settingsSlidesChanged) {
          transaction.set(
            settingsCollection.doc("general"),
            {
              whyUsSlides: prepared.whyUsSlides,
              servicesSlides: prepared.servicesSlides,
              whyUsImage: FieldValue.delete(),
              servicesImage: FieldValue.delete(),
            },
            { merge: true },
          );
        }
        return {
          published: true,
          status: "published",
          cleanupStatus: "not-needed",
        };
      },
    );
    if (!result) {
      console.error("Failed to verify site images draft version");
      return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
    }
    return { success: true, data: result };
  } catch {
    console.error("Failed to publish site images");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
