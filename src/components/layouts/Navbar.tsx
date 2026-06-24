import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_PHONE, NAVBAR_DROPDOWN_MAX_ITEMS } from "@/constants/ui";
import { NavLink } from "@/components/ui/NavLink";
import { ChevronDown, Bug, MapPin } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { MobileMenu } from "./MobileMenu";
import { NavbarActions } from "./NavbarActions";
import { MegaMenuColumn } from "./MegaMenuColumn";
import { generateWhatsAppUrl, generateTelUrl } from "@/utils/phone";
import logoImg from "@/../public/dmr.svg";
import { type PestDoc, type RegionDoc, type SettingsDoc } from "@/types";
import { getGlobalData } from "@/lib/global-data";

export const Navbar = async () => {
  let pests: PestDoc[] = [];
  let regions: RegionDoc[] = [];
  let settings: SettingsDoc = {};

  try {
    const data = await getGlobalData();
    pests = data.pests;
    regions = data.regions;
    settings = data.settings;
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.globalDataFetch, error);
  }

  const rawPhone = settings.phone || DEFAULT_PHONE;
  const whatsappUrl = generateWhatsAppUrl(rawPhone);
  const telUrl = generateTelUrl(rawPhone);

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-surface border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <Image
                src={logoImg}
                alt={DICTIONARY.navbar.logo.alt}
                title={DICTIONARY.navbar.logo.title}
                width={160}
                height={40}
                priority
                className="h-10 lg:h-12 w-auto dark:invert dark:brightness-0"
              />
            </Link>
          </div>

          {/* Desktop Navigation*/}
          <nav className="hidden lg:flex space-x-8 items-center h-full">
            {/* Mega Menu Wrapper */}
            <div className="group h-full flex items-center">
              <button className="text-sm font-medium text-text-primary hover:text-brand-primary transition-colors flex items-center group/btn">
                {DICTIONARY.navbar.links.services}
                <ChevronDown
                  className="w-4 h-4 ml-1 opacity-50 group-hover/btn:opacity-100 group-hover/btn:rotate-180 transition-all duration-300"
                  aria-hidden="true"
                />
              </button>

              {/* Mega Menu Dropdown */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-max invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out z-50">
                <div className="bg-brand-surface rounded-b-brand-lg shadow-xl border border-brand-border p-8 flex gap-12">
                  {/* Left Column - According to pest type */}
                  <MegaMenuColumn
                    title={DICTIONARY.navbar.columns.pests}
                    icon={Bug}
                    items={pests}
                    emptyStateMessage={DICTIONARY.navbar.emptyStates.pests}
                    baseRoute={ROUTES.pestBase}
                    maxItems={NAVBAR_DROPDOWN_MAX_ITEMS}
                    viewAllText={DICTIONARY.navbar.columns.viewAllPests}
                    viewAllRoute={ROUTES.services}
                  />

                  {/* Right Column - According to region */}
                  <MegaMenuColumn
                    title={DICTIONARY.navbar.columns.regions}
                    icon={MapPin}
                    items={regions}
                    emptyStateMessage={DICTIONARY.navbar.emptyStates.regions}
                    baseRoute={ROUTES.regionBase}
                    maxItems={NAVBAR_DROPDOWN_MAX_ITEMS}
                    viewAllText={DICTIONARY.navbar.columns.viewAllRegions}
                    viewAllRoute={ROUTES.regions}
                  />
                </div>
              </div>
            </div>

            <NavLink href={ROUTES.about}>
              {DICTIONARY.navbar.links.about}
            </NavLink>
            <NavLink href={ROUTES.contact}>
              {DICTIONARY.navbar.links.contact}
            </NavLink>
          </nav>

          {/* Mobile Navigation */}
          <MobileMenu
            pests={pests}
            regions={regions}
            whatsappUrl={whatsappUrl}
            telUrl={telUrl}
          />

          {/* Right Actions (Scroll Aware) */}
          <NavbarActions whatsappUrl={whatsappUrl} telUrl={telUrl} />
        </div>
      </div>
    </header>
  );
};
