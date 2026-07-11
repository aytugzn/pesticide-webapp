import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_PHONE } from "@/constants/ui";
import { NavLink } from "@/components/ui/NavLink";
import { Button } from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { MobileMenu } from "./MobileMenu";
import { NavbarActions } from "./NavbarActions";
import { NavbarContactStrip } from "./NavbarContactStrip";
import { MegaMenuColumns } from "./MegaMenuColumns";
import { generateWhatsAppUrl, generateTelUrl } from "@/utils/phone";
import logoImg from "@/../public/logo.svg";
import { getGlobalData } from "@/features/settings/data";

export const Navbar = async () => {
  const { pests, regions, settings } = await getGlobalData();

  const rawPhone = settings.phone || DEFAULT_PHONE;
  const whatsappUrl = generateWhatsAppUrl(rawPhone);
  const telUrl = generateTelUrl(rawPhone);

  return (
    <>
      {/* Static Top Strip for Contact Info */}
      <NavbarContactStrip
        phone={rawPhone}
        phoneHref={telUrl}
        workingHours={settings.workingHours}
        email={settings.email}
      />

      <header className="sticky top-0 z-50 w-full bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                href={ROUTES.home}
                className="relative block h-10 w-40 lg:h-12 lg:w-48"
              >
                <Image
                  src={logoImg}
                  alt={DICTIONARY.global.logo.alt}
                  title={DICTIONARY.global.logo.title}
                  fill
                  priority
                  className="object-contain object-left dark:invert dark:brightness-0"
                />
              </Link>
            </div>

            {/* Desktop Navigation*/}
            <nav className="hidden lg:flex space-x-8 items-center h-full">
              {/* Mega Menu Wrapper */}
              <div className="group h-full flex items-center">
                <Button
                  variant="unstyled"
                  size="none"
                  className="text-sm font-medium text-text-primary hover:text-brand-primary group-hover:text-brand-primary transition-colors flex items-center"
                >
                  {DICTIONARY.navbar.links.services}
                  <ChevronDown
                    className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-300"
                    aria-hidden="true"
                  />
                </Button>

                {/* Mega Menu Dropdown */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-max invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out z-50">
                  <div className="bg-brand-surface rounded-b-brand-lg shadow-xl border border-brand-border p-8 flex gap-12">
                    <MegaMenuColumns
                      pests={pests}
                      regions={regions}
                      variant="desktop"
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
    </>
  );
};
