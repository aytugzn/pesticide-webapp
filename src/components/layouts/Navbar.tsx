import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { NavLink } from "@/components/ui/NavLink";
import { ChevronDown, Bug, MapPin } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";
import { DICTIONARY } from "@/constants/dictionary";
import { MobileMenu } from "./MobileMenu";
import { NavbarActions } from "./NavbarActions";
import { generateWhatsAppUrl, generateTelUrl } from "@/utils/phone";
import logoImg from '@/../public/dmr.svg'
import { type PestDoc, type RegionDoc, type SettingsDoc } from "@/types";
import { parsePestDoc, parseRegionDoc, parseSettingsDoc } from "@/utils/parsers";
import { unstable_cacheTag as cacheTag } from "next/cache";

async function getNavbarData() {
  "use cache";
  cacheTag("navbar");

  const [pestsSnap, regionsSnap, settingsSnap] = await Promise.all([
    adminDb.collection("pests").where("isActive", "==", true).get(),
    adminDb.collection("regions").where("isActive", "==", true).get(),
    adminDb.collection("settings").doc("general").get(),
  ]);

  return {
    pests: pestsSnap.docs.map((doc) => parsePestDoc(doc.data())),
    regions: regionsSnap.docs.map((doc) => parseRegionDoc(doc.data())),
    settings: parseSettingsDoc(settingsSnap.data()),
  };
}



const Navbar = async () => {
  let pests: PestDoc[] = [];
  let regions: RegionDoc[] = [];
  let settings: SettingsDoc = {};

  try {
    const data = await getNavbarData();
    pests = data.pests;
    regions = data.regions;
    settings = data.settings;
  } catch (error) {
    console.error("Navbar data fetch error:", error);
  }
  
  const rawPhone = settings.phone || "905000000000";
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
                alt={DICTIONARY.navbar.logoAlt} 
                width={160} 
                height={40} 
                priority 
                className="h-10 md:h-12 w-auto dark:invert dark:brightness-0" 
              />
            </Link>
          </div>

          {/* Desktop Navigation*/}
          <nav className="hidden md:flex space-x-8 items-center h-full">
            
            {/* Mega Menu Wrapper */}
            <div className="group h-full flex items-center">
              <button className="flex items-center gap-1 text-sm font-medium text-text-primary group-hover:text-brand-primary transition-colors h-full">
                {DICTIONARY.navbar.services}
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200"  aria-hidden="true" />
              </button>

              {/* Mega Menu Dropdown */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-max invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out z-50">
                <div className="bg-brand-surface rounded-b-brand-lg shadow-xl border border-brand-border p-8 flex gap-12">
                  
                  {/* Left Column - According to pest type */}
                  <div className="w-64">
                    <h3 className="text-xs font-bold text-text-muted tracking-wider uppercase mb-5 pb-2 border-b border-brand-border">
                      {DICTIONARY.navbar.pestsCol}
                    </h3>
                    <ul className="space-y-4">
                      {pests.length === 0 ? (
                        <li className="text-sm text-text-muted">{DICTIONARY.navbar.emptyPests}</li>
                      ) : (
                        pests.map((pest) => (
                          <li key={pest.slug}>
                            <Link 
                              href={`${ROUTES.pestBase}/${pest.slug}`}
                              className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand-primary transition-colors group/item"
                            >
                              <Bug className="w-4 h-4 text-text-muted group-hover/item:text-brand-primary transition-colors"  aria-hidden="true" />
                              <span className="font-medium">{pest.name}</span>
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  {/* Right Column - According to region */}
                  <div className="w-64">
                    <h3 className="text-xs font-bold text-text-muted tracking-wider uppercase mb-5 pb-2 border-b border-brand-border">
                      {DICTIONARY.navbar.regionsCol}
                    </h3>
                    <ul className="space-y-4">
                      {regions.length === 0 ? (
                        <li className="text-sm text-text-muted">{DICTIONARY.navbar.emptyRegions}</li>
                      ) : (
                        regions.map((region) => (
                          <li key={region.slug}>
                            <Link 
                              href={`${ROUTES.regionBase}/${region.slug}`}
                              className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand-primary transition-colors group/item"
                            >
                              <MapPin className="w-4 h-4 text-text-muted group-hover/item:text-brand-primary transition-colors"  aria-hidden="true" />
                              <span className="font-medium">{region.name}</span>
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            <NavLink href={ROUTES.about}>{DICTIONARY.navbar.about}</NavLink>
            <NavLink href={ROUTES.contact}>{DICTIONARY.navbar.contact}</NavLink>
          </nav>

          {/* Mobile Navigation */}
          <MobileMenu pests={pests} regions={regions} />

          {/* Right Actions (Scroll Aware) */}
          <NavbarActions whatsappUrl={whatsappUrl} telUrl={telUrl} />

        </div>
      </div>
    </header>
  );
};

export { Navbar };
