import Link from "next/link";
import { Bug, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { CLICK_EFFECT } from "@/constants/ui";

type ServiceCardProps = {
  variant?: "default" | "viewAll";
  href: string;
  title: string;
  ariaLabel?: string;
  className?: string;
}

export const ServiceCard = ({
  variant = "default",
  href,
  title,
  ariaLabel,
  className = "",
}: ServiceCardProps) => {
  if (variant === "viewAll") {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          "group relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-brand-primary text-brand-surface overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-brand-primary/30 hover:-translate-y-1",
          CLICK_EFFECT,
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-hover to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
        
        <h3 className="font-bold flex-1 text-sm sm:text-base relative z-10 leading-snug">
          {title}
        </h3>
        
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-surface/20 flex items-center justify-center flex-shrink-0 group-hover:translate-x-2 transition-transform duration-300 relative z-10">
          <ArrowRight size={20} className="sm:w-6 sm:h-6" aria-hidden="true" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-surface-neutral hover:bg-brand-surface overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/5 hover:-translate-y-1",
        CLICK_EFFECT,
        className
      )}
    >
      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
      
      {/* Icon */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-surface shadow-sm text-brand-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-brand-surface transition-all duration-300 relative z-10">
        <Bug size={20} className="sm:w-6 sm:h-6" aria-hidden="true" />
      </div>
      
      {/* Text */}
      <h3 className="font-bold text-text-primary text-sm sm:text-base group-hover:text-brand-primary transition-colors relative z-10 leading-snug">
        {title}
      </h3>
    </Link>
  );
};
