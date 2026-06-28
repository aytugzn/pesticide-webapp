"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bug,
  Sparkles,
  FileText,
  MessageSquare,
  Star,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { DICTIONARY } from "@/constants/dictionary";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import logoImg from "@/../public/dmr_logo.svg";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const d = DICTIONARY.admin.dashboard;

const navItems = [
  { href: ROUTES.admin, label: d.title, icon: LayoutDashboard },
  { href: ROUTES.adminRegions, label: d.menu.regions, icon: Map },
  { href: ROUTES.adminPests, label: d.menu.pests, icon: Bug },
  {
    href: ROUTES.adminCombinations,
    label: d.menu.combinations,
    icon: Sparkles,
  },
  { href: ROUTES.adminReports, label: d.menu.reports, icon: FileText },
  { href: ROUTES.adminMessages, label: d.menu.messages, icon: MessageSquare },
  { href: ROUTES.adminReviews, label: d.menu.reviews, icon: Star },
  { href: ROUTES.adminSettings, label: d.menu.settings, icon: Settings },
];

const CLOSE_ICON_SIZE = 20;
const MENU_ICON_SIZE = 18;

const SidebarNavItem = ({
  item,
  isActive,
  onClose,
}: {
  item: typeof navItems[0];
  isActive: boolean;
  onClose: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group",
        isActive
          ? "bg-brand-primary/10 text-brand-primary shadow-sm"
          : "text-text-primary hover:bg-surface-neutral hover:text-brand-primary"
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-brand-primary rounded-r-full"
          aria-hidden="true"
        />
      )}
      <Icon
        size={MENU_ICON_SIZE}
        className={cn(
          "transition-transform duration-300",
          isActive ? "opacity-100 scale-110" : "opacity-70 group-hover:scale-110"
        )}
      />
      {item.label}
    </Link>
  );
};

const SidebarHeader = ({ onClose }: { onClose: () => void }) => (
  <div className="flex items-center justify-between h-16 px-6 border-b border-brand-border bg-brand-surface-light/30">
    <Link href={ROUTES.admin} className="flex flex-col w-16 py-2">
      <Image
        src={logoImg}
        alt={DICTIONARY.navbar.logo.alt}
        width={100}
        height={28}
        className="w-full h-auto object-contain"
        priority
      />
    </Link>
    <Button
      variant="unstyled"
      size="none"
      onClick={onClose}
      className="md:hidden text-text-muted hover:text-text-primary p-1 rounded-md"
      aria-label={DICTIONARY.navbar.mobileMenu.closeAria}
    >
      <X size={CLOSE_ICON_SIZE} />
    </Button>
  </div>
);

const SidebarFooter = ({ onLogout }: { onLogout: () => void }) => (
  <div className="p-4 border-t border-brand-border">
    <Button
      variant="unstyled"
      size="none"
      onClick={onLogout}
      className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-text hover:bg-error-bg transition-colors"
    >
      <LogOut size={MENU_ICON_SIZE} />
      {d.logout}
    </Button>
  </div>
);

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = ROUTES.login;
    } catch (err) {
      console.error(DICTIONARY.systemErrors.logs.logout, err);
    }
  };

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-brand-surface border-r border-brand-border transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
    isOpen ? "translate-x-0" : "-translate-x-full"
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <SidebarHeader onClose={onClose} />
          
          <nav
            className="flex-1 overflow-y-auto py-4 px-3 space-y-1"
            aria-label={d.navAria}
          >
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClose={onClose}
              />
            ))}
          </nav>

          <SidebarFooter onLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
};
