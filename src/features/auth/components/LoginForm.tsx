"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { createSession } from "../actions";
import { AUTH_ERRORS } from "../types";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/ui/Icons";

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
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await credential.user.getIdToken();
      const result = await createSession(idToken);

      if (!result.success) {
        if (result.error === AUTH_ERRORS.UNAUTHORIZED_EMAIL) {
          await signOut(getFirebaseAuth());
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
    <div className="flex flex-col gap-5 w-full">
      {error && (
        <div
          className="bg-error-bg/50 border border-error-border text-error-text rounded-xl px-4 py-3.5 text-sm font-medium animate-in fade-in slide-in-from-top-2"
          role="alert"
        >
          {error}
        </div>
      )}

      <Button
        variant="unstyled"
        size="none"
        id="google-login-btn"
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="group relative flex items-center justify-center gap-3 w-full px-5 py-3.5 bg-brand-surface text-text-primary border border-brand-border rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <span>{DICTIONARY.auth.login.loadingButton}</span>
          </div>
        ) : (
          <>
            <GoogleIcon className="w-4 h-4" />
            <span>{DICTIONARY.auth.login.button}</span>
          </>
        )}
      </Button>
    </div>
  );
};
