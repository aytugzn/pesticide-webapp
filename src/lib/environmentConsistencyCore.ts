import { AppError } from "@/lib/exceptions";

type EnvironmentPair = {
  integration: "cloudinary" | "firebase";
  publicName: string;
  publicValue: string | undefined;
  serverName: string;
  serverValue: string | undefined;
};

/**
 * Rejects a configured client/server identity mismatch without exposing values.
 * Missing values remain the responsibility of the integration-specific config
 * validator so optional integrations do not become globally mandatory.
 */
const assertEnvironmentPairMatches = ({
  integration,
  publicName,
  publicValue,
  serverName,
  serverValue,
}: EnvironmentPair): void => {
  const normalizedPublicValue = publicValue?.trim();
  const normalizedServerValue = serverValue?.trim();

  if (
    !normalizedPublicValue ||
    !normalizedServerValue ||
    normalizedPublicValue === normalizedServerValue
  ) {
    return;
  }

  throw new AppError(
    `${integration} client/server configuration mismatch`,
    "CONFIG_ERROR",
    {
      integration,
      variables: [publicName, serverName],
    },
  );
};

/** Validates Firebase client and Admin project identity when both are configured. */
export const assertFirebaseProjectConsistency = (): void =>
  assertEnvironmentPairMatches({
    integration: "firebase",
    publicName: "NEXT_PUBLIC_FIRESTORE_PROJECT_ID",
    publicValue: process.env.NEXT_PUBLIC_FIRESTORE_PROJECT_ID,
    serverName: "FIREBASE_PROJECT_ID",
    serverValue: process.env.FIREBASE_PROJECT_ID,
  });

/** Validates Cloudinary delivery and Admin API cloud identity when both are configured. */
export const assertCloudinaryCloudConsistency = (): void =>
  assertEnvironmentPairMatches({
    integration: "cloudinary",
    publicName: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    publicValue: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    serverName: "CLOUDINARY_CLOUD_NAME",
    serverValue: process.env.CLOUDINARY_CLOUD_NAME,
  });
