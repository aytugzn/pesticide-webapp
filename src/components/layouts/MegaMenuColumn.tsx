import Link from "next/link";
import { type ElementType } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";

type MenuColumnVariant = "desktop" | "mobile";

type MegaMenuColumnProps = {
  variant?: MenuColumnVariant;
  title: string;
  icon: ElementType;
  items: { slug: string; name: string }[];
  emptyStateMessage: string;
  baseRoute: string;
  itemIcon?: ElementType;
  maxItems?: number;
  viewAllText?: string;
  viewAllRoute?: string;
  onItemClick?: () => void;
}

export const MegaMenuColumn = ({
  variant = "desktop",
  title,
  icon: Icon,
  items,
  emptyStateMessage,
  baseRoute,
  itemIcon: ItemIcon,
  maxItems,
  viewAllText,
  viewAllRoute,
  onItemClick,
}: MegaMenuColumnProps) => {
  const hasMore = maxItems ? items.length > maxItems : false;
  const displayedItems = maxItems ? items.slice(0, maxItems) : items;

  const isDesktop = variant === "desktop";

  const styles = {
    wrapper: cn(isDesktop && "w-64"),
    title: cn(
      "font-bold flex items-center",
      isDesktop 
        ? "font-heading text-sm text-text-primary mb-4" 
        : "text-xs text-text-muted tracking-wider uppercase mb-3"
    ),
    titleIcon: cn(
      "w-4 h-4 mr-2",
      isDesktop ? "text-brand-primary" : "text-text-muted"
    ),
    list: "space-y-3",
    empty: "text-sm text-text-muted",
    link: cn(
      "flex items-center gap-3 text-sm text-text-secondary transition-colors",
      isDesktop ? "hover:text-brand-primary group/item" : "active:text-brand-primary"
    ),
    itemIcon: cn(
      "w-4 h-4 text-text-muted",
      isDesktop && "group-hover/item:text-brand-primary transition-colors"
    ),
    viewAllLi: cn(
      "pt-2 mt-1 border-t",
      isDesktop ? "border-brand-border" : "border-brand-border/50"
    ),
    viewAllLink: cn(
      "flex items-center text-sm font-medium text-brand-primary transition-colors",
      isDesktop && "hover:text-brand-primary-dark group/view-all"
    ),
    viewAllIcon: cn(
      "w-4 h-4 ml-1",
      isDesktop && "transform group-hover/view-all:translate-x-1 transition-transform"
    ),
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        {isDesktop && <Icon className={styles.titleIcon} aria-hidden="true" />}
        {title}
      </h3>
      <ul className={styles.list}>
        {items.length === 0 ? (
          <li className={styles.empty}>{emptyStateMessage}</li>
        ) : (
          <>
            {displayedItems.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`${baseRoute}/${item.slug}`}
                  onClick={onItemClick}
                  className={styles.link}
                >
                  {ItemIcon && (
                    <ItemIcon className={styles.itemIcon} aria-hidden="true" />
                  )}
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
            {hasMore && viewAllText && viewAllRoute && (
              <li className={styles.viewAllLi}>
                <Link
                  href={viewAllRoute}
                  onClick={onItemClick}
                  className={styles.viewAllLink}
                >
                  {viewAllText}
                  <ArrowRight
                    className={styles.viewAllIcon}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
};
