import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { getGlobalData } from "@/features/settings/actions";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { CopyrightText } from "@/components/ui/CopyrightText";
import { InstagramIcon, FacebookIcon } from "@/components/ui/Icons";
import logoImg from "@/../public/dmr_logo.svg";
import { generateTelUrl, generateWhatsAppUrl } from "@/utils/phone";

const CORPORATE_LINKS = [
  { href: ROUTES.about, label: DICTIONARY.footer.links.about },
  { href: ROUTES.services, label: DICTIONARY.footer.links.services },
  { href: ROUTES.contact, label: DICTIONARY.footer.links.contact },
  { href: ROUTES.privacy, label: DICTIONARY.footer.links.privacy },
  { href: ROUTES.terms, label: DICTIONARY.footer.links.terms },
  { href: ROUTES.kvkk, label: DICTIONARY.footer.links.kvkk },
];

export const Footer = async () => {
  const { pests, regions, settings } = await getGlobalData();

  const footerPests = pests.slice(0, 5);
  const footerRegions = regions.slice(0, 5);

  const phoneHref = settings.phone ? generateTelUrl(settings.phone) : "";
  const whatsappHref = settings.phone ? generateWhatsAppUrl(settings.phone) : "";
  const finalInstagramUrl = settings.instagramUrl || DICTIONARY.social.instagram.url;
  const finalFacebookUrl = settings.facebookUrl || DICTIONARY.social.facebook.url;

  return (
    <footer className="bg-brand-surface border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
          
          <FooterBrand 
            instagramUrl={finalInstagramUrl}
            facebookUrl={finalFacebookUrl}
            whatsappHref={whatsappHref}
            phone={settings.phone}
          />

          <FooterContact 
            address={settings.address}
            phone={settings.phone}
            phoneHref={phoneHref}
            workingHours={settings.workingHours}
            email={settings.email}
          />

          <FooterLinksColumn 
            title={DICTIONARY.footer.sections.corporate}
            links={CORPORATE_LINKS}
          />

          {footerPests.length > 0 && (
            <FooterLinksColumn 
              title={DICTIONARY.footer.sections.services}
              links={footerPests.map(p => ({ href: `${ROUTES.pestBase}/${p.slug}`, label: p.name }))}
            />
          )}

          {footerRegions.length > 0 && (
            <FooterLinksColumn 
              title={DICTIONARY.footer.sections.regions}
              links={footerRegions.map(r => ({ href: `${ROUTES.regionBase}/${r.slug}`, label: r.name }))}
            />
          )}
        </div>

        <FooterBottomBar />
      </div>
    </footer>
  );
};

// --- Subcomponents ---

type FooterBrandProps = {
  instagramUrl: string;
  facebookUrl: string;
  whatsappHref: string;
  phone?: string;
};

const FooterBrand = ({ instagramUrl, facebookUrl, whatsappHref, phone }: FooterBrandProps) => (
  <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-4 xl:col-span-2">
    <div className="w-fit block mb-2">
      <div className="relative w-48 h-12">
        <Image
          src={logoImg}
          alt={DICTIONARY.navbar.logo.alt}
          title={DICTIONARY.navbar.logo.title}
          draggable={false}
          fill
          className="object-contain object-left dark:invert dark:brightness-0"
        />
      </div>
    </div>
    <p className="text-text-secondary leading-relaxed max-w-sm text-sm">
      {DICTIONARY.footer.description}
    </p>
    <div className="flex items-center gap-3 mt-1">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={DICTIONARY.social.instagram.aria}
          className="w-9 h-9 rounded-full bg-brand-surface-hover flex items-center justify-center text-text-secondary hover:text-instagram hover:bg-instagram/10 transition-colors"
        >
          <InstagramIcon className="w-4 h-4" />
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={DICTIONARY.social.facebook.aria}
          className="w-9 h-9 rounded-full bg-brand-surface-hover flex items-center justify-center text-text-secondary hover:text-facebook hover:bg-facebook/10 transition-colors"
        >
          <FacebookIcon className="w-4 h-4" />
        </a>
      )}
      {phone && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={DICTIONARY.social.whatsapp.aria}
          className="w-9 h-9 rounded-full bg-brand-surface-hover flex items-center justify-center text-text-secondary hover:text-whatsapp hover:bg-whatsapp/10 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      )}
    </div>
  </div>
);

type FooterContactProps = {
  address?: string;
  phone?: string;
  phoneHref: string;
  workingHours?: string;
  email?: string;
};

const FooterContact = ({ address, phone, phoneHref, workingHours, email }: FooterContactProps) => (
  <div className="flex flex-col gap-3 md:col-span-1">
    <h3 className="font-heading font-semibold text-text-primary text-base whitespace-nowrap">
      {DICTIONARY.footer.sections.contact}
    </h3>
    <ul className="flex flex-col gap-3">
      <li className="flex items-center gap-2.5">
        <MapPin className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
        <span className="text-text-secondary text-sm">
          {address || DICTIONARY.footer.contact.address}
        </span>
      </li>
      {phone && (
        <li className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
          <a
            href={phoneHref}
            className="text-text-secondary hover:text-brand-primary transition-colors font-medium text-sm whitespace-nowrap"
          >
            {phone}
          </a>
        </li>
      )}
      {workingHours && (
        <li className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
          <span className="text-text-secondary text-sm">
            {workingHours}
          </span>
        </li>
      )}
      <li className="flex items-center gap-2.5">
        <Mail className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
        <a
          href={`mailto:${email || DICTIONARY.footer.contact.email}`}
          className="text-text-secondary hover:text-brand-primary transition-colors text-sm"
        >
          {email || DICTIONARY.footer.contact.email}
        </a>
      </li>
    </ul>
  </div>
);

type FooterLink = {
  href: string;
  label: string;
};

type FooterLinksColumnProps = {
  title: string;
  links: FooterLink[];
};

const FooterLinksColumn = ({ title, links }: FooterLinksColumnProps) => (
  <div className="flex flex-col gap-3 md:col-span-1">
    <h3 className="font-heading font-semibold text-text-primary text-base whitespace-nowrap">
      {title}
    </h3>
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-text-secondary hover:text-brand-primary transition-colors text-sm whitespace-nowrap"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const FooterBottomBar = () => (
  <div className="mt-8 pt-6 border-t border-brand-border flex flex-col md:flex-row items-center justify-between gap-3">
    <p className="text-text-tertiary text-xs text-center md:text-left">
      <CopyrightText text={DICTIONARY.global.copyright} />
    </p>
    <p className="text-text-tertiary text-xs flex items-center gap-1.5">
      <span>{DICTIONARY.footer.developer.title}</span>
      <span className="w-1 h-1 rounded-full bg-brand-primary" aria-hidden="true"></span>
      <span className="font-medium text-text-secondary">
        {DICTIONARY.footer.developer.name}
      </span>
    </p>
  </div>
);
