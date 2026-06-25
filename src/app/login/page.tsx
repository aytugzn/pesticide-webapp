import { LoginForm } from "@/features/auth/components/LoginForm";
import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { CopyrightText } from "@/components/ui/CopyrightText";

export const metadata: Metadata = {
  title: DICTIONARY.auth.login.page.metadataTitle,
  robots: { index: false, follow: false },
};

const LoginPage = () => (
  <main className="min-h-screen flex">

    {/* Left Panel: Brand */}
    <div className="hidden lg:flex lg:w-1/2 bg-brand-primary flex-col justify-between p-14 relative overflow-hidden">

      {/* Decorative Circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-surface/5 pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-brand-surface/5 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10">
        <p className="text-brand-surface/50 text-xs font-medium tracking-widest uppercase mb-16">
          {DICTIONARY.auth.login.page.badge}
        </p>
        <p className="font-heading font-bold text-brand-surface text-5xl leading-snug mb-5">
          {DICTIONARY.auth.login.page.brand}
        </p>
        <p className="text-brand-surface/60 text-lg font-light leading-relaxed max-w-xs">
          {DICTIONARY.auth.login.page.tagline}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-surface/30" aria-hidden="true" />
        <p className="text-brand-surface/35 text-xs">
          <CopyrightText text={DICTIONARY.global.copyright} />
        </p>
      </div>
    </div>

    {/* Login Cart */}
    <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background">
      <div className="w-full max-w-sm">

        <div className="bg-brand-surface border border-brand-border rounded-brand-lg p-8 shadow-sm">
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-2xl font-bold font-heading text-text-primary tracking-tight">
              {DICTIONARY.auth.login.title}
            </h1>
            <p className="text-sm text-text-secondary">
              {DICTIONARY.auth.login.subtitle}
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>

  </main>
);

export default LoginPage;
