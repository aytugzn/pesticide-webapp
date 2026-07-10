import "server-only";

import { getAdminApp } from "@/lib/firebase-admin";

type DecodedFirebaseToken = Record<string, unknown> & {
  uid: string;
  sub: string;
  email?: string;
  auth_time?: number;
};

type SessionCookieOptions = {
  expiresIn: number;
};

type AdminAuthAdapter = {
  verifyIdToken: (idToken: string) => Promise<DecodedFirebaseToken>;
  createSessionCookie: (
    idToken: string,
    options: SessionCookieOptions,
  ) => Promise<string>;
  verifySessionCookie: (
    sessionCookie: string,
    checkRevoked?: boolean,
  ) => Promise<DecodedFirebaseToken>;
};

type CertCacheEntry = {
  expiresAt: number;
  certs: Record<string, string>;
};

type LookupUserResponse = {
  users?: Array<{
    disabled?: boolean;
    validSince?: string;
  }>;
};

type SessionCookieResponse = {
  sessionCookie?: string;
};

const ID_TOKEN_CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const SESSION_COOKIE_CERT_URL =
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";
const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const DEFAULT_CERT_CACHE_SECONDS = 3600;

let idTokenCertCache: CertCacheEntry | null = null;
let sessionCookieCertCache: CertCacheEntry | null = null;

const createAuthError = (code: string): Error & { code: string } =>
  Object.assign(new Error(code), { code });

const getProjectId = (): string => {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw createAuthError("auth/missing-project-id");
  }

  return projectId;
};

const getAccessToken = async (): Promise<string> => {
  const credential = getAdminApp().options.credential;

  if (!credential) {
    throw createAuthError("auth/missing-credential");
  }

  const token = await credential.getAccessToken();
  return token.access_token;
};

const getMaxAgeSeconds = (cacheControl: string | null): number => {
  if (!cacheControl) return DEFAULT_CERT_CACHE_SECONDS;

  const maxAge = cacheControl
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("max-age="))
    ?.split("=")[1];

  const parsed = Number(maxAge);
  return Number.isFinite(parsed) ? parsed : DEFAULT_CERT_CACHE_SECONDS;
};

const fetchCerts = async (
  url: string,
  currentCache: CertCacheEntry | null,
): Promise<CertCacheEntry> => {
  if (currentCache && currentCache.expiresAt > Date.now()) {
    return currentCache;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw createAuthError("auth/cert-fetch-failed");
  }

  const certs = (await response.json()) as Record<string, string>;
  const maxAgeSeconds = getMaxAgeSeconds(response.headers.get("cache-control"));

  return {
    certs,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };
};

const getIdTokenCerts = async (): Promise<Record<string, string>> => {
  idTokenCertCache = await fetchCerts(ID_TOKEN_CERT_URL, idTokenCertCache);
  return idTokenCertCache.certs;
};

const getSessionCookieCerts = async (): Promise<Record<string, string>> => {
  sessionCookieCertCache = await fetchCerts(
    SESSION_COOKIE_CERT_URL,
    sessionCookieCertCache,
  );
  return sessionCookieCertCache.certs;
};

const verifyFirebaseJwt = async (
  token: string,
  issuer: string,
  getCerts: () => Promise<Record<string, string>>,
): Promise<DecodedFirebaseToken> => {
  const { decodeProtectedHeader, importX509, jwtVerify } = await import("jose");
  const header = decodeProtectedHeader(token);

  if (!header.kid) {
    throw createAuthError("auth/missing-key-id");
  }

  const certs = await getCerts();
  const cert = certs[header.kid];

  if (!cert) {
    throw createAuthError("auth/no-matching-key-id");
  }

  const projectId = getProjectId();
  const publicKey = await importX509(cert, "RS256");
  const { payload } = await jwtVerify(token, publicKey, {
    audience: projectId,
    issuer,
    algorithms: ["RS256"],
  });

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw createAuthError("auth/invalid-subject");
  }

  return {
    ...payload,
    uid: payload.sub,
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    auth_time:
      typeof payload.auth_time === "number" ? payload.auth_time : undefined,
  };
};

const authFetch = async <T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const projectId = getProjectId();
  const accessToken = await getAccessToken();
  const response = await fetch(
    `${FIREBASE_AUTH_BASE_URL}/projects/${projectId}${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Client-Version": "Node/Admin/custom-auth-adapter",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw createAuthError(`auth/rest-${response.status}`);
  }

  return (await response.json()) as T;
};

const verifyNotRevokedOrDisabled = async (
  decodedToken: DecodedFirebaseToken,
): Promise<void> => {
  const response = await authFetch<LookupUserResponse>("/accounts:lookup", {
    localId: [decodedToken.sub],
  });
  const user = response.users?.[0];

  if (!user) {
    throw createAuthError("auth/user-not-found");
  }

  if (user.disabled) {
    throw createAuthError("auth/user-disabled");
  }

  if (user.validSince && typeof decodedToken.auth_time === "number") {
    const validSinceMs = Number(user.validSince) * 1000;
    const authTimeMs = decodedToken.auth_time * 1000;

    if (Number.isFinite(validSinceMs) && authTimeMs < validSinceMs) {
      throw createAuthError("auth/session-cookie-revoked");
    }
  }
};

export const getAdminAuth = async (): Promise<AdminAuthAdapter> => {
  const projectId = getProjectId();

  return {
    verifyIdToken: (idToken: string) =>
      verifyFirebaseJwt(
        idToken,
        `https://securetoken.google.com/${projectId}`,
        getIdTokenCerts,
      ),
    createSessionCookie: async (
      idToken: string,
      options: SessionCookieOptions,
    ) => {
      const response = await authFetch<SessionCookieResponse>(
        ":createSessionCookie",
        {
          idToken,
          validDuration: Math.floor(options.expiresIn / 1000),
        },
      );

      if (!response.sessionCookie) {
        throw createAuthError("auth/session-cookie-missing");
      }

      return response.sessionCookie;
    },
    verifySessionCookie: async (
      sessionCookie: string,
      checkRevoked = false,
    ) => {
      const decodedToken = await verifyFirebaseJwt(
        sessionCookie,
        `https://session.firebase.google.com/${projectId}`,
        getSessionCookieCerts,
      );

      if (checkRevoked) {
        await verifyNotRevokedOrDisabled(decodedToken);
      }

      return decodedToken;
    },
  };
};
