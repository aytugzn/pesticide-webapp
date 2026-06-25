"use client";

import { useState } from "react";
import {
  Menu,
  ChevronDown,
  Bug,
  MapPin,
  Phone,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { ScrollButton } from "@/components/ui/ScrollButton";
import { NAVBAR_DROPDOWN_MAX_ITEMS } from "@/constants/ui";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { MegaMenuColumn } from "./MegaMenuColumn";
import type { PestDoc, RegionDoc } from "@/types";

type MobileMenuProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
  whatsappUrl: string;
  telUrl: string;
};

export const MobileMenu = ({
  pests,
  regions,
  whatsappUrl,
  telUrl,
}: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isServicesOpen, setIsServicesOpen] = useState<boolean>(false);

  // To close the menu when a page changes
  const closeMenu = () => {
    setIsOpen(false);
    setIsServicesOpen(false);
  };

  return (
    <div className="lg:hidden flex items-center">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-3 rounded-md text-text-primary active:bg-foreground/10 transition-colors touch-manipulation"
        aria-label={DICTIONARY.navbar.mobileMenu.openAria}
      >
        <Menu className="w-6 h-6 pointer-events-none" aria-hidden="true" />
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={closeMenu}
        title={DICTIONARY.navbar.mobileMenu.title}
      >
        <nav
          aria-label={DICTIONARY.navbar.mobileMenu.navAria}
          className="flex flex-col"
        >
          {/* Services Accordion */}
          <div className="flex flex-col border-b border-brand-border pb-4">
            <button
              onClick={() => setIsServicesOpen((prev) => !prev)}
              className="flex items-center justify-between text-sm font-medium text-text-primary py-2 touch-manipulation"
              aria-expanded={isServicesOpen}
              aria-controls="mobile-services-menu"
            >
              {DICTIONARY.navbar.links.services}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isServicesOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            <div
              id="mobile-services-menu"
              className={`grid transition-all duration-300 ease-in-out ${isServicesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col pl-4 pt-2 space-y-6">
                  <MegaMenuColumn
                    variant="mobile"
                    title={DICTIONARY.navbar.columns.pests}
                    icon={Bug}
                    items={pests}
                    emptyStateMessage={DICTIONARY.navbar.emptyStates.pests}
                    baseRoute={ROUTES.pestBase}
                    itemIcon={Bug}
                    onItemClick={closeMenu}
                    maxItems={NAVBAR_DROPDOWN_MAX_ITEMS}
                    viewAllText={DICTIONARY.navbar.columns.viewAllPests}
                    viewAllRoute={ROUTES.services}
                  />

                  <MegaMenuColumn
                    variant="mobile"
                    title={DICTIONARY.navbar.columns.regions}
                    icon={MapPin}
                    items={regions}
                    emptyStateMessage={DICTIONARY.navbar.emptyStates.regions}
                    baseRoute={ROUTES.regionBase}
                    itemIcon={MapPin}
                    onItemClick={closeMenu}
                    maxItems={NAVBAR_DROPDOWN_MAX_ITEMS}
                    viewAllText={DICTIONARY.navbar.columns.viewAllRegions}
                    viewAllRoute={ROUTES.regions}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Other Links */}
          <div className="flex flex-col space-y-4 pt-2">
            <Link
              href={ROUTES.about}
              onClick={closeMenu}
              className="text-sm font-medium text-text-primary py-2"
            >
              {DICTIONARY.navbar.links.about}
            </Link>
            <Link
              href={ROUTES.contact}
              onClick={closeMenu}
              className="text-sm font-medium text-text-primary py-2"
            >
              {DICTIONARY.navbar.links.contact}
            </Link>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-8 hidden sm:flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              href={telUrl}
              variant="primary"
              className="flex-1 justify-center px-2 font-bold shadow-sm"
            >
              <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
              <span className="truncate">
                {DICTIONARY.social.phone.callNow}
              </span>
            </Button>
            <Button
              href={whatsappUrl}
              variant="success"
              className="flex-1 justify-center border border-whatsapp/50 dark:border-whatsapp/30 px-2 font-bold shadow-sm"
              external
            >
              <MessageCircle
                className="w-4 h-4 mr-2 fill-current"
                aria-hidden="true"
              />
              <span className="truncate">
                {DICTIONARY.social.whatsapp.text}
              </span>
            </Button>
          </div>
          <ScrollButton
            targetId="contact"
            onClick={closeMenu}
            variant="outline"
            className="w-full justify-center bg-brand-surface font-bold shadow-sm"
          >
            <PhoneCall className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>{DICTIONARY.social.phone.callMeBack}</span>
          </ScrollButton>
        </div>
      </Drawer>
    </div>
  );
};
