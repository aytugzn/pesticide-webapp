import "server-only";

import { cache } from "react";
import { Redis } from "@upstash/redis";
import type { Firestore } from "firebase-admin/firestore";
import { DICTIONARY } from "@/constants/dictionary";
import {
  DEFAULT_PHONE,
  HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK,
} from "@/constants/ui";
import type { HomeData } from "@/features/home/types";
import { parseReviewItems } from "@/features/reviews/utils";
import type {
  GlobalData,
  PublicSnapshotStatus,
} from "@/features/settings/types";
import { AppError } from "@/lib/exceptions";
import type { CombinationDoc, SettingsDoc } from "@/types";
import {
  parseCombinationDoc,
  parsePestDoc,
  parseRegionDoc,
  parseSettingsDoc,
  parseSiteImageSlides,
} from "@/utils/parsers";

export const PUBLIC_SNAPSHOT_KEY = "dmr:public:last-known-good";

export const PUBLIC_SNAPSHOT_SCHEMA_VERSION = 2 as const;
export const PUBLIC_SNAPSHOT_MAX_BYTES = 900_000;
const PUBLIC_SNAPSHOT_CAS_MAX_ATTEMPTS = 4;

const PUBLIC_SNAPSHOT_COMPARE_AND_SET_SCRIPT = `
local current = redis.call("GET", KEYS[1])
local expectedExists = ARGV[1]
local expectedValue = ARGV[2]
local nextValue = ARGV[3]

if expectedExists == "0" then
  if current then return 0 end
elseif not current or current ~= expectedValue then
  return 0
end

redis.call("SET", KEYS[1], nextValue)
return 1
`;

export type PublicDataSnapshot = {
  schemaVersion: typeof PUBLIC_SNAPSHOT_SCHEMA_VERSION;
  revision: number;
  updatedAt: number;
  data: {
    globalData: GlobalData;
    homeData: HomeData;
    combinationsById: Record<string, CombinationDoc>;
  };
};

export type PublicSnapshotChanges = {
  fullActivation: boolean;
  globalDataChanged: boolean;
  homeDataChanged: boolean;
  settingsChanged: boolean;
  pestsChanged: boolean;
  regionsChanged: boolean;
  heroSlidesChanged: boolean;
  reviewsChanged: boolean;
  combinationsChanged: boolean;
  addedCombinationIds: string[];
  changedCombinationIds: string[];
  removedCombinationIds: string[];
};

export type PublicSnapshotActivationReceipt = {
  serializedSnapshot: string;
  revision: number;
};

export type PublicSnapshotUpdateResult = {
  status: PublicSnapshotStatus;
  changes: PublicSnapshotChanges;
  failureReason?:
    | "read"
    | "conflict"
    | "canonical-build"
    | "invalid"
    | "too-large"
    | "write";
  sizeBytes?: number;
  activationReceipt?: PublicSnapshotActivationReceipt;
};

export type PublicSnapshotResolution =
  | { status: "available"; snapshot: PublicDataSnapshot }
  | { status: "missing" | "temporarily-unavailable" };

export type SnapshotReadResult =
  | { status: "success"; snapshot: PublicDataSnapshot }
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "failed" };

const LOCAL_HERO_SLIDES: HomeData["slides"] = [
  {
    id: "backup-hero-1",
    imageUrl: "/backup/hero/hero-1.webp",
    altText: DICTIONARY.admin.settings.siteImages.heroAltDefault,
    order: 0,
  },
  {
    id: "backup-hero-2",
    imageUrl: "/backup/hero/hero-2.webp",
    altText: DICTIONARY.admin.settings.siteImages.heroAltDefault,
    order: 1,
  },
  {
    id: "backup-hero-3",
    imageUrl: "/backup/hero/hero-3.webp",
    altText: DICTIONARY.admin.settings.siteImages.heroAltDefault,
    order: 2,
  },
];

const LOCAL_SETTINGS: SettingsDoc = {
  phone: DEFAULT_PHONE,
  email: DICTIONARY.footer.contact.email,
  address: DICTIONARY.global.contact.address,
  workingHours: DICTIONARY.global.contact.workingHours,
  instagramUrl: DICTIONARY.social.instagram.url,
  facebookUrl: DICTIONARY.social.facebook.url,
  defaultOgImage: DICTIONARY.meta.og.image.fallback,
  heroAutoplayDelay: HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  servicesAutoplayDelay: SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  whyUsAutoplayDelay: WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  reviewsAutoplayDelay: REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  servicesSlides: [
    {
      id: "backup-services",
      imageUrl: "/backup/services.webp",
      altText: DICTIONARY.admin.settings.siteImages.servicesAltDefault,
      order: 0,
    },
  ],
  whyUsSlides: [
    {
      id: "backup-why-us",
      imageUrl: "/backup/why-us.webp",
      altText: DICTIONARY.admin.settings.siteImages.whyUsAltDefault,
      order: 0,
    },
  ],
};

let publicSnapshotRedis: Redis | null | undefined;

/** Returns whether an unknown value is a plain object record. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Returns an empty, serializable public-domain change summary. */
export const createEmptyPublicSnapshotChanges = (): PublicSnapshotChanges => ({
  fullActivation: false,
  globalDataChanged: false,
  homeDataChanged: false,
  settingsChanged: false,
  pestsChanged: false,
  regionsChanged: false,
  heroSlidesChanged: false,
  reviewsChanged: false,
  combinationsChanged: false,
  addedCombinationIds: [],
  changedCombinationIds: [],
  removedCombinationIds: [],
});

/** Returns whether a change summary owns at least one cache responsibility. */
export const hasPublicSnapshotChanges = (
  changes: PublicSnapshotChanges,
): boolean =>
  changes.fullActivation ||
  changes.globalDataChanged ||
  changes.homeDataChanged ||
  changes.settingsChanged ||
  changes.pestsChanged ||
  changes.regionsChanged ||
  changes.heroSlidesChanged ||
  changes.reviewsChanged ||
  changes.combinationsChanged ||
  changes.addedCombinationIds.length > 0 ||
  changes.changedCombinationIds.length > 0 ||
  changes.removedCombinationIds.length > 0;

/** Merges public-domain changes while deduplicating combination IDs. */
export const mergePublicSnapshotChanges = (
  ...summaries: readonly PublicSnapshotChanges[]
): PublicSnapshotChanges => {
  const merged = createEmptyPublicSnapshotChanges();
  const addedIds = new Set<string>();
  const changedIds = new Set<string>();
  const removedIds = new Set<string>();

  summaries.forEach((summary) => {
    merged.fullActivation ||= summary.fullActivation;
    merged.globalDataChanged ||= summary.globalDataChanged;
    merged.homeDataChanged ||= summary.homeDataChanged;
    merged.settingsChanged ||= summary.settingsChanged;
    merged.pestsChanged ||= summary.pestsChanged;
    merged.regionsChanged ||= summary.regionsChanged;
    merged.heroSlidesChanged ||= summary.heroSlidesChanged;
    merged.reviewsChanged ||= summary.reviewsChanged;
    merged.combinationsChanged ||= summary.combinationsChanged;
    summary.addedCombinationIds.forEach((id) => addedIds.add(id));
    summary.changedCombinationIds.forEach((id) => changedIds.add(id));
    summary.removedCombinationIds.forEach((id) => removedIds.add(id));
  });

  merged.globalDataChanged =
    merged.globalDataChanged ||
    merged.settingsChanged ||
    merged.pestsChanged ||
    merged.regionsChanged;
  merged.homeDataChanged =
    merged.homeDataChanged ||
    merged.heroSlidesChanged ||
    merged.reviewsChanged;
  merged.combinationsChanged =
    merged.combinationsChanged ||
    addedIds.size > 0 ||
    changedIds.size > 0 ||
    removedIds.size > 0;
  merged.addedCombinationIds = [...addedIds].sort();
  merged.changedCombinationIds = [...changedIds].sort();
  merged.removedCombinationIds = [...removedIds].sort();
  return merged;
};

/** Builds the complete first-activation responsibility set. */
const createFullPublicSnapshotChanges = (
  snapshot: PublicDataSnapshot,
): PublicSnapshotChanges =>
  mergePublicSnapshotChanges({
    ...createEmptyPublicSnapshotChanges(),
    fullActivation: true,
    settingsChanged: true,
    pestsChanged: true,
    regionsChanged: true,
    heroSlidesChanged: true,
    reviewsChanged: true,
    combinationsChanged: true,
    addedCombinationIds: Object.keys(snapshot.data.combinationsById).sort(),
  });

/** Compares canonical snapshots and returns exact public cache ownership. */
export const getPublicSnapshotChanges = (
  previous: PublicDataSnapshot,
  next: PublicDataSnapshot,
): PublicSnapshotChanges => {
  const changes = createEmptyPublicSnapshotChanges();
  changes.pestsChanged =
    JSON.stringify(previous.data.globalData.pests) !==
    JSON.stringify(next.data.globalData.pests);
  changes.regionsChanged =
    JSON.stringify(previous.data.globalData.regions) !==
    JSON.stringify(next.data.globalData.regions);
  changes.settingsChanged =
    JSON.stringify(previous.data.globalData.settings) !==
    JSON.stringify(next.data.globalData.settings);
  changes.heroSlidesChanged =
    JSON.stringify(previous.data.homeData.slides) !==
    JSON.stringify(next.data.homeData.slides);
  changes.reviewsChanged =
    JSON.stringify({
      reviews: previous.data.homeData.customReviews,
      url: previous.data.homeData.viewAllReviewsUrl,
    }) !==
    JSON.stringify({
      reviews: next.data.homeData.customReviews,
      url: next.data.homeData.viewAllReviewsUrl,
    });

  const previousCombinations = previous.data.combinationsById;
  const nextCombinations = next.data.combinationsById;
  const combinationIds = new Set([
    ...Object.keys(previousCombinations),
    ...Object.keys(nextCombinations),
  ]);
  combinationIds.forEach((id) => {
    const previousCombination = previousCombinations[id];
    const nextCombination = nextCombinations[id];
    if (!previousCombination && nextCombination) {
      changes.addedCombinationIds.push(id);
    } else if (previousCombination && !nextCombination) {
      changes.removedCombinationIds.push(id);
    } else if (
      JSON.stringify(previousCombination) !== JSON.stringify(nextCombination)
    ) {
      changes.changedCombinationIds.push(id);
    }
  });

  return mergePublicSnapshotChanges(changes);
};

/** Lazily creates the isolated fail-open public snapshot Redis client. */
const getPublicSnapshotRedis = (): Redis | null => {
  if (publicSnapshotRedis !== undefined) return publicSnapshotRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || url === "..." || !url.startsWith("https://") || !token || token === "...") {
    publicSnapshotRedis = null;
    return publicSnapshotRedis;
  }

  try {
    publicSnapshotRedis = new Redis({
      url,
      token,
      automaticDeserialization: false,
    });
  } catch {
    publicSnapshotRedis = null;
  }

  return publicSnapshotRedis;
};

/** Parses an optional published reviews URL into a safe public value. */
export const parsePublicReviewsUrl = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "#";

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : "#";
  } catch {
    return "#";
  }
};

/** Parses a serialized Redis value without trusting its JSON shape. */
const parseSnapshotInput = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const COMBINATION_DOCUMENT_ID_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*_[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parses only safe cache activation metadata from the snapshot envelope. */
export const parsePendingPublicSnapshotChanges = (
  value: unknown,
): PublicSnapshotChanges => {
  const parsedInput = parseSnapshotInput(value);
  if (!isRecord(parsedInput) || !isRecord(parsedInput.activation)) {
    return createEmptyPublicSnapshotChanges();
  }
  const pendingChanges = parsedInput.activation.pendingChanges;
  if (!isRecord(pendingChanges)) return createEmptyPublicSnapshotChanges();

  const parseIds = (candidate: unknown): string[] =>
    Array.isArray(candidate)
      ? candidate.filter(
          (id): id is string =>
            typeof id === "string" &&
            COMBINATION_DOCUMENT_ID_PATTERN.test(id),
        )
      : [];
  const isTrue = (key: keyof PublicSnapshotChanges): boolean =>
    pendingChanges[key] === true;

  return mergePublicSnapshotChanges({
    fullActivation: isTrue("fullActivation"),
    globalDataChanged: isTrue("globalDataChanged"),
    homeDataChanged: isTrue("homeDataChanged"),
    settingsChanged: isTrue("settingsChanged"),
    pestsChanged: isTrue("pestsChanged"),
    regionsChanged: isTrue("regionsChanged"),
    heroSlidesChanged: isTrue("heroSlidesChanged"),
    reviewsChanged: isTrue("reviewsChanged"),
    combinationsChanged: isTrue("combinationsChanged"),
    addedCombinationIds: parseIds(pendingChanges.addedCombinationIds),
    changedCombinationIds: parseIds(pendingChanges.changedCombinationIds),
    removedCombinationIds: parseIds(pendingChanges.removedCombinationIds),
  });
};

/** Serializes a complete snapshot with optional retryable cache metadata. */
export const serializeStoredPublicSnapshot = (
  snapshot: PublicDataSnapshot,
  pendingChanges: PublicSnapshotChanges,
): string =>
  JSON.stringify({
    ...snapshot,
    ...(hasPublicSnapshotChanges(pendingChanges)
      ? { activation: { pendingChanges } }
      : {}),
  });

/** Measures the exact UTF-8 bytes persisted to Firestore and Redis. */
export const getStoredPublicSnapshotSizeBytes = (
  snapshot: PublicDataSnapshot,
  pendingChanges: PublicSnapshotChanges =
    createEmptyPublicSnapshotChanges(),
): number =>
  Buffer.byteLength(
    serializeStoredPublicSnapshot(snapshot, pendingChanges),
    "utf8",
  );

/**
 * Validates an untrusted Redis snapshot and rebuilds every public domain with
 * the same parsers used for Firestore data.
 *
 * @param value - Unknown Redis or serialized snapshot value
 * @returns A canonical public snapshot, or null for an invalid envelope
 */
export const parsePublicDataSnapshot = (
  value: unknown,
): PublicDataSnapshot | null => {
  const parsedInput = parseSnapshotInput(value);
  if (!isRecord(parsedInput)) return null;
  const isLegacyV1 = parsedInput.schemaVersion === 1;
  if (!isLegacyV1 && parsedInput.schemaVersion !== PUBLIC_SNAPSHOT_SCHEMA_VERSION) {
    return null;
  }
  if (
    typeof parsedInput.updatedAt !== "number" ||
    !Number.isSafeInteger(parsedInput.updatedAt) ||
    parsedInput.updatedAt <= 0
  ) {
    return null;
  }
  const revision = isLegacyV1 ? 0 : parsedInput.revision;
  if (
    typeof revision !== "number" ||
    !Number.isSafeInteger(revision) ||
    revision < 0
  ) {
    return null;
  }

  const rawData = parsedInput.data;
  if (!isRecord(rawData)) return null;
  const rawGlobalData = rawData.globalData;
  const rawHomeData = rawData.homeData;
  const rawCombinations = rawData.combinationsById;
  if (
    !isRecord(rawGlobalData) ||
    !Array.isArray(rawGlobalData.pests) ||
    !Array.isArray(rawGlobalData.regions) ||
    !isRecord(rawGlobalData.settings) ||
    !isRecord(rawHomeData) ||
    !Array.isArray(rawHomeData.slides) ||
    !Array.isArray(rawHomeData.customReviews) ||
    !isRecord(rawCombinations)
  ) {
    return null;
  }

  const pests = rawGlobalData.pests
    .map(parsePestDoc)
    .filter((pest) => Boolean(pest.slug && pest.name))
    .sort((first, second) => first.slug.localeCompare(second.slug));
  const regions = rawGlobalData.regions
    .map(parseRegionDoc)
    .filter((region) => Boolean(region.slug && region.name))
    .sort((first, second) => first.slug.localeCompare(second.slug));
  const combinationsById: Record<string, CombinationDoc> = {};

  Object.keys(rawCombinations)
    .sort()
    .forEach((docId) => {
      const combination = parseCombinationDoc(rawCombinations[docId]);
      const isAddressable =
        Boolean(combination.region && combination.pest) &&
        docId === `${combination.region}_${combination.pest}`;
      if (isAddressable) {
        combinationsById[docId] = combination;
      }
    });

  return {
    schemaVersion: PUBLIC_SNAPSHOT_SCHEMA_VERSION,
    revision,
    updatedAt: parsedInput.updatedAt,
    data: {
      globalData: {
        pests,
        regions,
        settings: parseSettingsDoc(rawGlobalData.settings),
      },
      homeData: {
        slides: parseSiteImageSlides(rawHomeData.slides),
        customReviews: parseReviewItems(rawHomeData.customReviews),
        viewAllReviewsUrl: parsePublicReviewsUrl(
          rawHomeData.viewAllReviewsUrl,
        ),
      },
      combinationsById,
    },
  };
};

/** Projects the active entity catalog used by public layouts and routes. */
export const getVisibleGlobalData = (
  snapshot: PublicDataSnapshot,
): GlobalData => ({
  pests: snapshot.data.globalData.pests.filter(
    (pest) => pest.isActive === true,
  ),
  regions: snapshot.data.globalData.regions.filter(
    (region) => region.isActive === true,
  ),
  settings: snapshot.data.globalData.settings,
});

/** Projects only addressable combinations whose published parents are active. */
export const getVisibleCombinationsById = (
  snapshot: PublicDataSnapshot,
): Record<string, CombinationDoc> => {
  const globalData = getVisibleGlobalData(snapshot);
  const activePests = new Map(
    globalData.pests.map((pest) => [pest.slug, pest.name]),
  );
  const activeRegions = new Map(
    globalData.regions.map((region) => [region.slug, region.name]),
  );
  const visible: Record<string, CombinationDoc> = {};

  Object.keys(snapshot.data.combinationsById)
    .sort()
    .forEach((docId) => {
      const combination = snapshot.data.combinationsById[docId];
      if (
        combination.isActive === true &&
        combination.isArchived !== true &&
        activeRegions.has(combination.region) &&
        activePests.has(combination.pest)
      ) {
        visible[docId] = {
          ...combination,
          regionName:
            combination.regionName ||
            activeRegions.get(combination.region) ||
            combination.region,
          pestName:
            combination.pestName ||
            activePests.get(combination.pest) ||
            combination.pest,
        };
      }
    });

  return visible;
};

/** Reads the fixed Redis key and reports missing, invalid, and provider states. */
const readPublicSnapshot = async (): Promise<SnapshotReadResult> => {
  const redis = getPublicSnapshotRedis();
  if (!redis) return { status: "failed" };

  try {
    const rawSnapshot = await redis.get<unknown>(PUBLIC_SNAPSHOT_KEY);
    if (rawSnapshot === null || rawSnapshot === undefined) {
      return { status: "missing" };
    }

    const snapshot = parsePublicDataSnapshot(rawSnapshot);
    return snapshot
      ? { status: "success", snapshot }
      : { status: "invalid" };
  } catch {
    return { status: "failed" };
  }
};

/** Deduplicates parsed Redis snapshot reads within one React server request. */
/** Creates a request-scoped resolver sharing one Redis GET and parse result. */
export const createRequestPublicSnapshotResolution = (
  readSnapshot: () => Promise<SnapshotReadResult>,
) =>
  cache(async (): Promise<PublicSnapshotResolution> => {
    const result = await readSnapshot();
    if (result.status === "success") {
      return { status: "available", snapshot: result.snapshot };
    }
    if (result.status === "missing") return { status: "missing" };
    console.warn("Failed to read public fallback snapshot");
    return { status: "temporarily-unavailable" };
  });

const getRequestPublicSnapshotResolution =
  createRequestPublicSnapshotResolution(readPublicSnapshot);

/** Returns one shared Redis resolution per server render request. */
export const getPublicSnapshotResolution = async (): Promise<
  PublicSnapshotResolution
> => getRequestPublicSnapshotResolution();

/** Returns the available parsed snapshot while preserving legacy callers. */
export const getPublicSnapshot = async (): Promise<PublicDataSnapshot | null> => {
  const resolution = await getPublicSnapshotResolution();
  return resolution.status === "available" ? resolution.snapshot : null;
};

/** Returns the Redis global-data fallback from the shared parsed snapshot. */
export const getGlobalDataFromSnapshot = async (): Promise<GlobalData | null> =>
  ((snapshot) => (snapshot ? getVisibleGlobalData(snapshot) : null))(
    await getPublicSnapshot(),
  );

/** Returns the Redis home-data fallback from the shared parsed snapshot. */
export const getHomeDataFromSnapshot = async (): Promise<HomeData | null> =>
  (await getPublicSnapshot())?.data.homeData ?? null;

/** Returns the canonical Redis combination map from the parsed snapshot. */
export const getCombinationsFromSnapshot = async (): Promise<
  Record<string, CombinationDoc> | null
> =>
  ((snapshot) => (snapshot ? getVisibleCombinationsById(snapshot) : null))(
    await getPublicSnapshot(),
  );

/** Returns safe local settings used only after Firestore and Redis fail. */
export const getLocalSettingsFallback = (): SettingsDoc => ({
  ...LOCAL_SETTINGS,
  servicesSlides: [...(LOCAL_SETTINGS.servicesSlides ?? [])],
  whyUsSlides: [...(LOCAL_SETTINGS.whyUsSlides ?? [])],
});

/** Returns safe local global data without inventing dynamic public entities. */
export const getLocalGlobalDataFallback = (): GlobalData => ({
  pests: [],
  regions: [],
  settings: getLocalSettingsFallback(),
});

/** Returns safe local home content backed by repository image assets. */
export const getLocalHomeDataFallback = (): HomeData => ({
  slides: [...LOCAL_HERO_SLIDES],
  customReviews: [],
  viewAllReviewsUrl: "#",
});

/**
 * Builds a full published candidate from editable canonical Firestore data.
 *
 * @param db - Authorized Admin Firestore instance
 * @returns Parser-validated public data for one snapshot replacement
 */
export const createCanonicalPublishedSnapshotCandidate = async (
  db: Firestore,
): Promise<PublicDataSnapshot> => {
  const [pestsSnap, regionsSnap, settingsSnap, heroSnap, reviewsSnap, combinationsSnap] =
    await Promise.all([
      db.collection("pests").get(),
      db.collection("regions").get(),
      db.collection("settings").doc("general").get(),
      db.collection("settings").doc("heroSlider").get(),
      db.collection("settings").doc("reviews").get(),
      db.collection("combinations").get(),
    ]);

  const pests = pestsSnap.docs
    .map((doc) => parsePestDoc(doc.data()))
    .filter((pest) => Boolean(pest.slug && pest.name))
    .sort((first, second) => first.slug.localeCompare(second.slug));
  const regions = regionsSnap.docs
    .map((doc) => parseRegionDoc(doc.data()))
    .filter((region) => Boolean(region.slug && region.name))
    .sort((first, second) => first.slug.localeCompare(second.slug));
  const combinationsById: Record<string, CombinationDoc> = {};

  [...combinationsSnap.docs]
    .sort((first, second) => first.id.localeCompare(second.id))
    .forEach((doc) => {
      const combination = parseCombinationDoc(doc.data());
      if (
        doc.id === `${combination.region}_${combination.pest}`
      ) {
        combinationsById[doc.id] = combination;
      }
    });

  const reviewsData = reviewsSnap.data();
  const candidate: PublicDataSnapshot = {
    schemaVersion: PUBLIC_SNAPSHOT_SCHEMA_VERSION,
    revision: 0,
    updatedAt: Date.now(),
    data: {
      globalData: {
        pests,
        regions,
        settings: parseSettingsDoc(settingsSnap.data()),
      },
      homeData: {
        slides: parseSiteImageSlides(heroSnap.data()?.slides),
        customReviews: parseReviewItems(reviewsData?.items),
        viewAllReviewsUrl: parsePublicReviewsUrl(reviewsData?.viewAllUrl),
      },
      combinationsById,
    },
  };
  const validatedCandidate = parsePublicDataSnapshot(candidate);
  if (!validatedCandidate) {
    throw new AppError(
      "Invalid canonical public snapshot",
      "VALIDATION_ERROR",
    );
  }

  return validatedCandidate;
};

/** Guards a corrupt existing value from automatic replacement by empty data. */
const hasMeaningfulPublicData = (snapshot: PublicDataSnapshot): boolean =>
  snapshot.data.globalData.pests.length > 0 ||
  snapshot.data.globalData.regions.length > 0 ||
  snapshot.data.homeData.slides.length > 0 ||
  snapshot.data.homeData.customReviews.length > 0 ||
  Object.keys(snapshot.data.combinationsById).length > 0;

export type PublicSnapshotStore = {
  get: () => Promise<unknown>;
  compareAndSet: (
    expectedValue: string | null,
    nextValue: string,
  ) => Promise<boolean>;
};

/** Converts an injected store value into the exact CAS comparison value. */
const serializeStoreValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * Applies validated fixed-key replacement semantics through an injected store.
 *
 * @param store - Snapshot persistence adapter
 * @param createCandidate - Canonical snapshot factory
 * @param requiresCanonicalComparison - Whether pending activation must be compared
 * @param requestedChanges - Domain responsibilities requiring retryable activation
 * @returns Deterministic snapshot replacement status
 */
export const replacePublicSnapshot = async (
  store: PublicSnapshotStore,
  createCandidate: () => Promise<PublicDataSnapshot>,
  requiresCanonicalComparison: boolean,
  requestedChanges: PublicSnapshotChanges =
    createEmptyPublicSnapshotChanges(),
): Promise<PublicSnapshotUpdateResult> => {
  const emptyChanges = createEmptyPublicSnapshotChanges();

  for (
    let attempt = 0;
    attempt < PUBLIC_SNAPSHOT_CAS_MAX_ATTEMPTS;
    attempt += 1
  ) {
    let rawSnapshot: unknown;
    try {
      rawSnapshot = await store.get();
    } catch {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "read",
      };
    }

    const expectedValue = serializeStoreValue(rawSnapshot);
    let existingResult: SnapshotReadResult;
    if (rawSnapshot === null || rawSnapshot === undefined) {
      existingResult = { status: "missing" };
    } else {
      const snapshot = parsePublicDataSnapshot(rawSnapshot);
      existingResult = snapshot
        ? { status: "success", snapshot }
        : { status: "invalid" };
    }
    const pendingChanges = parsePendingPublicSnapshotChanges(rawSnapshot);

    if (
      !requiresCanonicalComparison &&
      existingResult.status === "success" &&
      !hasPublicSnapshotChanges(pendingChanges) &&
      !hasPublicSnapshotChanges(requestedChanges)
    ) {
      return {
        status: "not-needed",
        changes: createEmptyPublicSnapshotChanges(),
      };
    }

    let candidate: PublicDataSnapshot;
    try {
      candidate = await createCandidate();
    } catch {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "canonical-build",
      };
    }

    if (
      existingResult.status === "invalid" &&
      !hasMeaningfulPublicData(candidate)
    ) {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "invalid",
      };
    }

    if (
      existingResult.status === "success" &&
      existingResult.snapshot.revision > candidate.revision
    ) {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "conflict",
      };
    }

    const dataChanged =
      existingResult.status !== "success" ||
      existingResult.snapshot.revision !== candidate.revision ||
      JSON.stringify(existingResult.snapshot.data) !==
        JSON.stringify(candidate.data);
    const inferredChanges =
      existingResult.status === "success"
        ? getPublicSnapshotChanges(existingResult.snapshot, candidate)
        : createFullPublicSnapshotChanges(candidate);
    const changes = mergePublicSnapshotChanges(
      pendingChanges,
      inferredChanges,
      requestedChanges,
    );

    if (!dataChanged && !hasPublicSnapshotChanges(changes)) {
      return { status: "not-needed", changes };
    }

    const storedSnapshot =
      !dataChanged && existingResult.status === "success"
        ? existingResult.snapshot
        : candidate;
    const serializedSnapshot = serializeStoredPublicSnapshot(
      storedSnapshot,
      changes,
    );
    const sizeBytes = Buffer.byteLength(serializedSnapshot, "utf8");
    if (sizeBytes > PUBLIC_SNAPSHOT_MAX_BYTES) {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "too-large",
        sizeBytes,
      };
    }
    if (!parsePublicDataSnapshot(serializedSnapshot)) {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "invalid",
        sizeBytes,
      };
    }

    if (
      !dataChanged &&
      expectedValue === serializedSnapshot
    ) {
      return {
        status: "not-needed",
        changes,
        sizeBytes,
        activationReceipt: {
          serializedSnapshot,
          revision: storedSnapshot.revision,
        },
      };
    }

    try {
      const wasStored = await store.compareAndSet(
        expectedValue,
        serializedSnapshot,
      );
      if (!wasStored) continue;

      return {
        status:
          existingResult.status === "missing"
            ? "initialized"
            : dataChanged
              ? "updated"
              : "not-needed",
        changes,
        sizeBytes,
        activationReceipt: {
          serializedSnapshot,
          revision: storedSnapshot.revision,
        },
      };
    } catch {
      return {
        status: "failed",
        changes: emptyChanges,
        failureReason: "write",
        sizeBytes,
      };
    }
  }

  return {
    status: "failed",
    changes: createEmptyPublicSnapshotChanges(),
    failureReason: "conflict",
  };
};

/** Creates the production fixed-key atomic compare-and-set adapter. */
const createPublicSnapshotStore = (redis: Redis): PublicSnapshotStore => ({
  get: async () => redis.get<unknown>(PUBLIC_SNAPSHOT_KEY),
  compareAndSet: async (expectedValue, nextValue) => {
    const result = await redis.eval<string[], unknown>(
      PUBLIC_SNAPSHOT_COMPARE_AND_SET_SCRIPT,
      [PUBLIC_SNAPSHOT_KEY],
      [expectedValue === null ? "0" : "1", expectedValue ?? "", nextValue],
    );
    return result === 1 || result === "1";
  },
});

/**
 * Synchronizes the single Redis key from an authoritative Firestore-published
 * snapshot after validation, no-op comparison, and serialized-size checks.
 *
 * @param publishedSnapshot - Committed Firestore published snapshot
 * @param requestedChanges - Domain changes requiring cache activation
 * @returns Snapshot status used to gate tag invalidation and cleanup
 */
export const updatePublicSnapshot = async (
  publishedSnapshot: PublicDataSnapshot,
  requestedChanges: PublicSnapshotChanges =
    createEmptyPublicSnapshotChanges(),
): Promise<PublicSnapshotUpdateResult> => {
  const redis = getPublicSnapshotRedis();
  if (!redis) {
    console.error("Failed to update public fallback snapshot");
    return {
      status: "failed",
      changes: createEmptyPublicSnapshotChanges(),
      failureReason: "read",
    };
  }

  const result = await replacePublicSnapshot(
    createPublicSnapshotStore(redis),
    async () => publishedSnapshot,
    true,
    requestedChanges,
  );
  if (result.status === "failed") {
    console.error("Failed to update public fallback snapshot");
  }
  return result;
};

/**
 * Clears retryable cache metadata only if no newer snapshot replaced it.
 * A CAS conflict intentionally leaves the newer activation state untouched.
 */
export const acknowledgePublicSnapshotActivation = async (
  receipt: PublicSnapshotActivationReceipt,
): Promise<boolean> => {
  const redis = getPublicSnapshotRedis();
  if (!redis) return false;

  const snapshot = parsePublicDataSnapshot(receipt.serializedSnapshot);
  if (!snapshot) return false;

  try {
    return await createPublicSnapshotStore(redis).compareAndSet(
      receipt.serializedSnapshot,
      JSON.stringify(snapshot),
    );
  } catch {
    console.error("Failed to acknowledge public cache activation");
    return false;
  }
};
