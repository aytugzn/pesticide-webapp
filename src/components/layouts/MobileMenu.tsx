"use client";

import { useState } from "react";
import { Menu, X, ChevronDown, Bug, MapPin } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import type { PestDoc, RegionDoc } from "@/types";

type MobileMenuProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
};

const MenuSection = ({
  title,
  items,
  emptyMessage,
  baseUrl,
  Icon,
  onItemClick,
}: {
  title: string;
  items: { name: string; slug: string }[];
  emptyMessage: string;
  baseUrl: string;
  Icon: React.ElementType;
  onItemClick: () => void;
}) => (
  <div>
    <h3 className="text-xs font-bold text-text-muted tracking-wider uppercase mb-3">
      {title}
    </h3>
    <ul className="space-y-3">
      {items.length === 0 ? (
        <li className="text-sm text-text-muted">{emptyMessage}</li>
      ) : (
        items.map((item) => (
          <li key={item.slug}>
            <Link 
              href={`${baseUrl}/${item.slug}`}
              onClick={onItemClick}
              className="flex items-center gap-3 text-sm text-text-secondary"
            >
              <Icon className="w-4 h-4 text-text-muted" />
              <span className="font-medium">{item.name}</span>
            </Link>
          </li>
        ))
      )}
    </ul>
  </div>
);

const MobileMenu = ({ pests, regions }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isServicesOpen, setIsServicesOpen] = useState<boolean>(false);

  // To close the menu when a page changes
  const closeMenu = () => {
    setIsOpen(false);
    setIsServicesOpen(false);
  };

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-md text-text-primary active:bg-black/10 dark:active:bg-white/10 transition-colors"
        aria-label={DICTIONARY.navbar.mobileMenuAria}
        style={{ touchAction: "manipulation" }}
      >
        {isOpen ? <X className="w-6 h-6 pointer-events-none" /> : <Menu className="w-6 h-6 pointer-events-none" />}
      </button>

      {/* Full Screen Overlay Menu */}
      <div 
        className={`fixed inset-x-0 top-20 bottom-0 bg-brand-surface border-t border-brand-border shadow-2xl z-[999] flex flex-col overflow-y-auto transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}`}
      >
        <div className="flex flex-col p-6 space-y-6">
            
            {/* Services Accordion */}
            <div className="flex flex-col border-b border-brand-border pb-4">
              <button 
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className="flex items-center justify-between text-sm font-medium text-text-primary py-2"
                style={{ touchAction: "manipulation" }}
              >
                {DICTIONARY.navbar.services}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isServicesOpen ? "rotate-180" : ""}`} />
              </button>
              
              <div className={`grid transition-all duration-300 ease-in-out ${isServicesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="flex flex-col pl-4 pt-2 space-y-6">
                    <MenuSection
                      title={DICTIONARY.navbar.pestsCol}
                      items={pests}
                      emptyMessage={DICTIONARY.navbar.emptyPests}
                      baseUrl={ROUTES.pestBase}
                      Icon={Bug}
                      onItemClick={closeMenu}
                    />
                    
                    <MenuSection
                      title={DICTIONARY.navbar.regionsCol}
                      items={regions}
                      emptyMessage={DICTIONARY.navbar.emptyRegions}
                      baseUrl={ROUTES.regionBase}
                      Icon={MapPin}
                      onItemClick={closeMenu}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Other Links */}
            <div className="flex flex-col space-y-4 pt-2">
              <Link href={ROUTES.about} onClick={closeMenu} className="text-sm font-medium text-text-primary py-2">
                {DICTIONARY.navbar.about}
              </Link>
              <Link href={ROUTES.contact} onClick={closeMenu} className="text-sm font-medium text-text-primary py-2">
                {DICTIONARY.navbar.contact}
              </Link>
            </div>

          </div>
        </div>
      </div>
  );
};

export { MobileMenu };
