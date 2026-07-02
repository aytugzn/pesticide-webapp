import { LoginForm } from "@/features/auth/components/LoginForm";
import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { CopyrightText } from "@/components/ui/CopyrightText";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import logoImg from "@/../public/dmr_logo.svg";

export const metadata: Metadata = {
  title: DICTIONARY.auth.login.page.metadataTitle,
  robots: { index: false, follow: false },
};

const ICON_SIZE = 16;

const LoginPage = () => (
  <main className="min-h-screen relative flex items-center justify-center bg-surface-neutral px-4">
    {/* Back Button */}
    <div className="absolute top-6 left-6 z-20">
      <Link
        href={ROUTES.home}
        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={ICON_SIZE} aria-hidden="true" />
        {DICTIONARY.admin.dashboard.backToSite}
      </Link>
    </div>

    <div className="w-full max-w-md bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden flex flex-col">
      {/* Top section with Logo */}
      <div className="pt-10 pb-6 px-8 flex flex-col items-center border-b border-brand-border/50 bg-brand-surface-light/30">
        <div className="w-48 h-auto mb-6 relative">
          <Image
            src={logoImg}
            alt={DICTIONARY.navbar.logo.alt}
            width={300}
            height={100}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-bold text-text-primary text-center">
          {DICTIONARY.auth.login.title}
        </h1>
        <p className="text-sm text-text-secondary mt-1.5 text-center">
          {DICTIONARY.auth.login.subtitle}
        </p>
      </div>

      {/* Form Section */}
      <div className="p-8">
        <LoginForm />
      </div>

      {/* Footer */}
      <div className="px-8 pb-6 text-center">
        <p className="text-xs text-text-muted">
          <CopyrightText text={DICTIONARY.global.copyright} />
        </p>
      </div>
    </div>
  </main>
);

export default LoginPage;
