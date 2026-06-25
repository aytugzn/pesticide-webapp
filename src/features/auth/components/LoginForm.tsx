"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createSession } from "../actions";
import { AUTH_ERRORS } from "../types";
import { LogIn } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";

const FIREBASE_ERROR_CODES = {
  popupClosed: "auth/popup-closed-by-user",
} as const;

// Helpers
const isPopupCancelled = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === FIREBASE_ERROR_CODES.popupClosed;

// Component
export const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      const result = await createSession(idToken);

      if (!result.success) {
        if (result.error === AUTH_ERRORS.UNAUTHORIZED_EMAIL) {
          await signOut(auth);
        }
        setError(DICTIONARY.auth.login.error);
        return;
      }

      router.push(ROUTES.admin);
    } catch (err) {
      if (isPopupCancelled(err)) return;
      setError(DICTIONARY.auth.login.error);
      console.error(DICTIONARY.systemErrors.logs.login, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div
          className="bg-error-bg border border-error-border text-error-text rounded-brand-md px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        id="google-login-btn"
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full px-5 py-3.5 bg-brand-surface border border-brand-border-strong text-text-primary rounded-brand-md text-sm font-medium shadow-xs cursor-pointer hover:bg-brand-primary-light hover:border-brand-border-strong transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span>{DICTIONARY.auth.login.loadingButton}</span>
        ) : (
          <>
            <LogIn className="w-5 h-5"  aria-hidden="true" />
            <span>{DICTIONARY.auth.login.button}</span>
          </>
        )}
      </button>
    </div>
  );
};
