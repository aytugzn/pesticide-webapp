import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "outline" | "success" | "icon";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  className?: string;
};

type ButtonAsButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never; external?: never };
type ButtonAsLinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand-primary text-brand-surface hover:bg-brand-primary-hover shadow-sm",
    outline: "border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-brand-surface",
    success: "bg-success-bg text-success-text hover:bg-success-border",
    icon: "bg-whatsapp/15 text-whatsapp hover:bg-whatsapp/25",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-xs gap-1.5 rounded-brand-md",
    md: "h-10 px-4 text-sm gap-2 rounded-brand-md",
    lg: "h-12 px-6 text-base gap-2 rounded-brand-lg",
    icon: "w-10 h-10 rounded-full",
  };

  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  if ("href" in props && props.href) {
    const { href, external, ...linkProps } = props as ButtonAsLinkProps;
    if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={classes} {...linkProps}>
          {children}
        </a>
      );
    }
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...(props as ButtonAsButtonProps)}>
      {children}
    </button>
  );
});

Button.displayName = "Button";
