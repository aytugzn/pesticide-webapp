import Link from "next/link";
import { ArrowRight, Bug, MapPin } from "lucide-react";
import { cn } from "@/utils/cn";
import { CLICK_EFFECT } from "@/constants/ui";

type RelatedLinkItem = {
  href: string;
  title: string;
  description?: string;
  icon: "bug" | "map-pin";
};

type RelatedLinksSectionProps = {
  title: string;
  items: RelatedLinkItem[];
  viewAllHref?: string;
  viewAllTitle?: string;
  viewAllDescription?: string;
  viewAllIcon?: RelatedLinkItem["icon"];
  showAllItems?: boolean;
};

const RELATED_LINKS_VISIBLE_ITEMS = 5;

export const RelatedLinksSection = ({
  title,
  items,
  viewAllHref,
  viewAllTitle,
  viewAllDescription,
  viewAllIcon,
  showAllItems = false,
}: RelatedLinksSectionProps) => {
  if (!items || items.length === 0) return null;

  const shouldShowViewAll =
    !showAllItems && !!viewAllHref && !!viewAllTitle && items.length > 0;
  const visibleItems = (() => {
    if (showAllItems) return items;

    return items.slice(0, RELATED_LINKS_VISIBLE_ITEMS);
  })();

  return (
    <section className="bg-surface-neutral relative overflow-x-clip">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full blur-3xl pointer-events-none z-0 opacity-5 bg-brand-primary"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-primary/10 to-transparent"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 relative z-10">
        <h2 className="font-heading font-black text-text-primary text-3xl sm:text-4xl leading-tight mb-6 text-center sm:text-left">
          {title}
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const IconComponent = item.icon === "map-pin" ? MapPin : Bug;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex h-full min-h-36 flex-col rounded-lg border border-brand-border bg-brand-surface p-4 transition-all hover:border-brand-primary/50 hover:bg-brand-surface-muted",
                    CLICK_EFFECT,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary">
                      <IconComponent className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-heading text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-brand-primary">
                      {item.title}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
          {shouldShowViewAll && (
            <li>
              <Link
                href={viewAllHref}
                className={cn(
                  "group flex h-full min-h-36 flex-col justify-between rounded-lg border border-brand-border bg-brand-surface p-4 transition-all hover:border-brand-primary/50 hover:bg-brand-surface-muted",
                  CLICK_EFFECT,
                )}
              >
                <div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary">
                      {viewAllIcon === "map-pin" ? (
                        <MapPin className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Bug className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <h3 className="font-heading text-lg font-bold leading-snug text-text-primary transition-colors group-hover:text-brand-primary">
                      {viewAllTitle}
                    </h3>
                  </div>
                  {viewAllDescription && (
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {viewAllDescription}
                    </p>
                  )}
                </div>
                <span className="mt-4 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
};
