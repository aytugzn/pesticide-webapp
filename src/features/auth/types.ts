export interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export const AUTH_ERRORS = {
  UNAUTHORIZED_EMAIL: "UNAUTHORIZED_EMAIL",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_CREATION_FAILED: "SESSION_CREATION_FAILED",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;