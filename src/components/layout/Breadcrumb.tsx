import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";

export type BreadcrumbItem = {
  name: string;
  url?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/** Renders the shared visible breadcrumb trail for public pages. */
export const Breadcrumb = ({ items, className }: BreadcrumbProps) => (
  <nav aria-label={DICTIONARY.global.breadcrumb} className={className}>
    <ol className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;

        return (
          <li key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-2">
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 shrink-0 text-text-muted/60"
                aria-hidden="true"
              />
            )}
            {isCurrent || !item.url ? (
              <span
                className="font-medium text-text-primary"
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="transition-colors hover:text-brand-primary"
              >
                {item.name}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
