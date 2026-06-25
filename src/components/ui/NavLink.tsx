"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
};

export const NavLink = ({ 
  href, 
  children, 
  className = "", 
  activeClassName = "text-brand-primary" 
}: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors ${
        isActive ? activeClassName : "text-text-primary hover:text-brand-primary"
      } ${className}`}
    >
      {children}
    </Link>
  );
};
