import Link from "next/link";
import { Bug, MapPin } from "lucide-react";
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
};

export const RelatedLinksSection = ({ title, items }: RelatedLinksSectionProps) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="bg-surface-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-8 text-center sm:text-left">
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const IconComponent = item.icon === "map-pin" ? MapPin : Bug;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-primary/50 hover:shadow-lg transition-all flex flex-col",
                  CLICK_EFFECT
                )}
              >
                <IconComponent
                  className="w-7 h-7 text-brand-primary mb-5"
                  aria-hidden="true"
                />
                <h3 className="font-heading font-bold text-text-primary text-xl group-hover:text-brand-primary transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-text-secondary text-sm leading-relaxed mt-3 flex-1">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
