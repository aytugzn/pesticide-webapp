type PublicPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export const PublicPageHeader = ({
  eyebrow,
  title,
  description,
}: PublicPageHeaderProps) => (
  <header className="bg-brand-surface border-b border-brand-border">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      {eyebrow && (
        <p className="text-brand-primary text-xs font-bold tracking-widest uppercase mb-3">
          {eyebrow}
        </p>
      )}
      <h1 className="font-heading font-black text-text-primary text-4xl sm:text-5xl leading-tight">
        {title}
      </h1>
      <p className="text-text-secondary text-lg leading-relaxed mt-5 max-w-3xl">
        {description}
      </p>
    </div>
  </header>
);
