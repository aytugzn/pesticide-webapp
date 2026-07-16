import "server-only";

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { updateTag } from "next/cache";
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
} from "./types";

/**
 * Publishes a validated site-image draft after the caller has completed admin
 * authorization. Image cache tags are refreshed after the atomic Firestore
 * commit and before best-effort Cloudinary cleanup.
 *
 * @param db - Admin Firestore instance obtained after authorization
 * @returns Publish and post-commit cleanup status
 */
export const publishSiteImagesDraft = async (
  db: Firestore,
): Promise<ActionResponse<PublishSiteImagesResult, SettingsErrorCode>> => {
  try {
    const settingsCollection = db.collection("settings");
    const generalRef = settingsCollection.doc("general");
    const heroRef = settingsCollection.doc("heroSlider");
    const draftRef = settingsCollection.doc(SITE_IMAGES_DRAFT_DOCUMENT_ID);
    const [generalSnap, heroSnap, draftSnap] = await Promise.all([
      generalRef.get(),
      heroRef.get(),
      draftRef.get(),
    ]);

    if (!draftSnap.exists) {
      return {
        success: true,
        data: { published: false, cleanupStatus: "not-needed" },
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
    const normalizedDraft = {
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
    const parsedDraft = saveSiteImagesSchema.safeParse(normalizedDraft);
    if (!parsedDraft.success) {
      return { success: false, error: SETTINGS_ERRORS.VALIDATION_FAILED };
    }

    const serializeSlides = (slides: SaveSiteImagesInput["heroSlides"]) =>
      slides.map((slide, index) => ({
        id: slide.id,
        ...(slide.image ? { image: slide.image } : {}),
        ...(slide.imageUrl ? { imageUrl: slide.imageUrl } : {}),
        altText: slide.altText,
        order: index,
      }));
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
    const cleanupCandidates = [...previousPublishedPublicIds].filter(
      (publicId) => !nextPublishedPublicIds.has(publicId),
    );

    const batch = db.batch();
    batch.set(heroRef, { slides: heroSlides }, { merge: true });
    batch.set(
      generalRef,
      {
        whyUsSlides,
        servicesSlides,
        whyUsImage: FieldValue.delete(),
        servicesImage: FieldValue.delete(),
      },
      { merge: true },
    );
    await batch.commit();

    updateTag("home-data");
    updateTag("global-data");

    if (cleanupCandidates.length === 0) {
      return {
        success: true,
        data: { published: true, cleanupStatus: "not-needed" },
      };
    }

    try {
      const currentSettingsSnapshot = await settingsCollection.get();
      const referencedPublicIds = new Set<string>();
      currentSettingsSnapshot.docs.forEach((doc) => {
        collectManagedSiteImagePublicIds(doc.data()).forEach((publicId) =>
          referencedPublicIds.add(publicId),
        );
      });
      const orphanedPublicIds = cleanupCandidates.filter(
        (publicId) => !referencedPublicIds.has(publicId),
      );

      if (orphanedPublicIds.length === 0) {
        return {
          success: true,
          data: { published: true, cleanupStatus: "not-needed" },
        };
      }

      const cleanupResults = await Promise.all(
        orphanedPublicIds.map(deleteManagedSiteImage),
      );
      return {
        success: true,
        data: {
          published: true,
          cleanupStatus: cleanupResults.every(Boolean)
            ? "success"
            : "partial-failure",
        },
      };
    } catch {
      console.error("Failed to verify stale site image references");
      return {
        success: true,
        data: { published: true, cleanupStatus: "partial-failure" },
      };
    }
  } catch {
    console.error("Failed to publish site images");
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
};
