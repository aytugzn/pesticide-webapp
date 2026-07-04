import type { ElementType, ReactNode } from "react";

type AdminListPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ElementType;
  children: ReactNode;
};

export const AdminListPage = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: AdminListPageProps) => (
  <div className="space-y-8">
    <header className="border-b border-brand-border pb-6">
      <p className="text-text-muted text-xs font-medium tracking-widest uppercase mb-1">
        {eyebrow}
      </p>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <h1 className="font-heading font-bold text-text-primary text-3xl">
          {title}
        </h1>
      </div>
      <p className="text-text-secondary text-sm mt-3 max-w-2xl">
        {description}
      </p>
    </header>

    {children}
  </div>
);
