import { Eyebrow } from "@/components/ui/Eyebrow";

type PublicPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export const PublicPageHeader = ({
  eyebrow,
  title,
  description,
}: PublicPageHeaderProps) => {
  const titleParts = title.split(" ");
  const titleHighlight =
    titleParts.length > 1 ? titleParts[titleParts.length - 1] : "";
  const titlePrefix = titleHighlight
    ? titleParts.slice(0, -1).join(" ")
    : title;

  return (
    <header className="relative overflow-hidden bg-surface-neutral border-b border-brand-border">
      <div
        className="absolute left-1/2 top-0 h-px w-4/5 max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="font-heading text-4xl font-black leading-tight text-text-primary sm:text-5xl">
          {titlePrefix}
          {titleHighlight && (
            <span className="text-brand-primary"> {titleHighlight}</span>
          )}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
    </header>
  );
};
