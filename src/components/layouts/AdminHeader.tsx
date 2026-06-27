"use client";

import { Menu, ExternalLink } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

const d = DICTIONARY.admin.dashboard;

const MENU_ICON_SIZE = 24;
const LINK_ICON_SIZE = 16;

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-brand-surface border-b border-brand-border">
      <div className="flex items-center gap-4">
        <Button
          variant="unstyled" size="none"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          aria-label={d.sidebarToggle}
        >
          <Menu size={MENU_ICON_SIZE} />
        </Button>
        <div className="hidden sm:block">
          {/* Breadcrumbs could go here if needed, keeping it minimal for now */}
          <span className="text-sm font-semibold text-text-primary">
            {d.subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.home}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors"
        >
          <span className="hidden sm:inline">{d.backToSite}</span>
          <ExternalLink size={LINK_ICON_SIZE} />
        </Link>
      </div>
    </header>
  );
};
