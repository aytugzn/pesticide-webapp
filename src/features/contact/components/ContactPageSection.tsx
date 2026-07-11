import Link from "next/link";
import { AlternatingSections } from "@/components/layout/AlternatingSections";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_PHONE } from "@/constants/ui";
import { ScrollButton } from "@/components/ui/ScrollButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ContactForm } from "@/features/home/components/ContactForm";
import { generateTelUrl, generateWhatsAppUrl } from "@/utils/phone";
import { InstagramIcon, FacebookIcon } from "@/components/ui/Icons";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PestDoc, RegionDoc, SettingsDoc } from "@/types";

type ContactPageSectionProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
  settings?: SettingsDoc;
};

type ContactChannel = {
  title: string;
  description: string;
  value: string;
  href?: string;
  external?: boolean;
  icon: LucideIcon | ComponentType<{ className?: string }>;
};

const VISIBLE_REGION_COUNT = 6;

export const ContactPageSection = ({
  pests,
  regions,
  settings,
}: ContactPageSectionProps) => {
  const data = DICTIONARY.home.contact;
  const channelsDict = data.channels;
  const pageDict = DICTIONARY.pages.contact;
  const phone = settings?.phone || DEFAULT_PHONE;
  const email = settings?.email || DICTIONARY.footer.contact.email;
  const address = settings?.address || DICTIONARY.global.contact.address;
  const phoneHref = generateTelUrl(phone);
  const whatsappHref = generateWhatsAppUrl(phone);
  const directionsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : undefined;
  const visibleRegions = regions.slice(0, VISIBLE_REGION_COUNT);
  const instagramUrl =
    settings?.instagramUrl || DICTIONARY.social.instagram.url;
  const facebookUrl = settings?.facebookUrl || DICTIONARY.social.facebook.url;
  const channels: ContactChannel[] = [
    {
      title: channelsDict.phoneTitle,
      description: channelsDict.phoneDesc,
      value: phone,
      href: phoneHref,
      icon: Phone,
    },
    {
      title: channelsDict.whatsappTitle,
      description: channelsDict.whatsappDesc,
      value: DICTIONARY.social.whatsapp.text,
      href: whatsappHref,
      icon: MessageCircle,
    },
    ...(settings?.workingHours
      ? [
          {
            title: pageDict.workingHours.title,
            description: pageDict.workingHours.description,
            value: settings.workingHours,
            icon: Clock,
          },
        ]
      : []),
    {
      title: channelsDict.emailTitle,
      description: channelsDict.emailDesc,
      value: email,
      href: `mailto:${email}`,
      icon: Mail,
    },
    {
      title: channelsDict.addressTitle,
      description: channelsDict.addressDesc,
      value: address,
      href: directionsHref,
      external: true,
      icon: MapPin,
    },
    {
      title: channelsDict.instagramTitle,
      description: channelsDict.instagramDesc,
      value: channelsDict.instagramTitle,
      href: instagramUrl,
      icon: InstagramIcon,
    },
    {
      title: channelsDict.facebookTitle,
      description: channelsDict.facebookDesc,
      value: channelsDict.facebookTitle,
      href: facebookUrl,
      icon: FacebookIcon,
    },
  ];
  const otherChannels = channels.filter(
    (channel) =>
      channel.title !== channelsDict.phoneTitle &&
      channel.title !== channelsDict.whatsappTitle &&
      channel.title !== pageDict.workingHours.title,
  );

  return (
    <AlternatingSections>
      <QuickContactSection
        phoneHref={phoneHref}
        phone={phone}
        whatsappHref={whatsappHref}
      />
      <ContactProcessSection />
      <ContactRequestInfoSection />
      <ServiceAreasSection regions={visibleRegions} />
      <OtherContactChannelsSection channels={otherChannels} />
      <ContactFormSection pests={pests} regions={regions} />
    </AlternatingSections>
  );
};

const QuickContactSection = ({
  phoneHref,
  phone,
  whatsappHref,
}: {
  phoneHref: string;
  phone: string;
  whatsappHref: string;
}) => {
  const data = DICTIONARY.home.contact.channels;
  const pageDict = DICTIONARY.pages.contact;

  return (
    <section
      className="py-20 md:py-28"
      aria-labelledby="contact-channels-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="contact-channels-heading"
          eyebrow={pageDict.quickActions.title}
          titlePrefix={pageDict.quickActions.titlePrefix}
          titleHighlight={pageDict.quickActions.titleHighlight}
          description={data.description}
          align="center"
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          <QuickActionLink
            href={phoneHref}
            icon={Phone}
            title={pageDict.quickActions.callButton}
            description={phone}
          />
          <QuickActionLink
            href={whatsappHref}
            icon={MessageCircle}
            title={pageDict.quickActions.whatsappButton}
            description={DICTIONARY.social.whatsapp.text}
            external
          />
          <QuickActionButton
            targetId="contact-form"
            icon={PhoneCall}
            title={pageDict.quickActions.callbackButton}
            description={pageDict.quickActions.callbackDescription}
          />
        </div>
      </div>
    </section>
  );
};

const ContactFormSection = ({
  pests,
  regions,
}: {
  pests: PestDoc[];
  regions: RegionDoc[];
}) => {
  const data = DICTIONARY.home.contact;

  return (
    <section
      className="scroll-mt-28 py-20 md:py-28"
      id="contact-form"
      aria-labelledby="contact-form-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="contact-form-heading"
          eyebrow={data.title}
          titlePrefix={data.titlePrefix}
          titleHighlight={data.titleHighlight}
          description={data.description}
          align="center"
        />

        <div className="mx-auto mt-12 max-w-4xl">
          <ContactForm
            pests={pests}
            regions={regions}
            className="max-w-none rounded-lg shadow-none"
          />
        </div>
      </div>
    </section>
  );
};

const OtherContactChannelsSection = ({
  channels,
}: {
  channels: ContactChannel[];
}) => {
  const pageDict = DICTIONARY.pages.contact;

  return (
    <section
      className="py-20 md:py-28"
      aria-labelledby="other-contact-channels-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="other-contact-channels-heading"
          eyebrow={pageDict.eyebrow}
          titlePrefix={pageDict.otherChannels.titlePrefix}
          titleHighlight={pageDict.otherChannels.titleHighlight}
          description={pageDict.otherChannels.description}
        />

        <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {channels.map((channel) => (
            <ContactChannelCard key={channel.title} channel={channel} />
          ))}
        </div>
      </div>
    </section>
  );
};

const QuickActionLink = ({
  href,
  icon: Icon,
  title,
  description,
  external,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  external?: boolean;
}) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    className="group flex items-center gap-4 rounded-lg border border-brand-primary/30 bg-brand-primary-light p-5 text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-surface-muted"
  >
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-brand-surface"
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0">
      <span className="block font-heading text-sm font-bold">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-brand-primary/80">
        {description}
      </span>
    </span>
    <ArrowRight
      className="ml-auto h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
      aria-hidden="true"
    />
  </a>
);

const QuickActionButton = ({
  targetId,
  icon: Icon,
  title,
  description,
}: {
  targetId: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <ScrollButton
    targetId={targetId}
    variant="unstyled"
    size="none"
    className="group flex w-full items-center gap-4 rounded-lg border border-brand-primary/30 bg-brand-primary-light p-5 text-left text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-surface-muted"
  >
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-brand-surface"
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0">
      <span className="block font-heading text-sm font-bold">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-brand-primary/80">
        {description}
      </span>
    </span>
    <ArrowRight
      className="ml-auto h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
      aria-hidden="true"
    />
  </ScrollButton>
);

const ContactProcessSection = () => {
  const channelsDict = DICTIONARY.home.contact.channels;

  return (
    <section
      className="py-20 md:py-28"
      aria-labelledby="contact-process-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="contact-process-heading"
          eyebrow={DICTIONARY.pages.contact.eyebrow}
          titlePrefix={channelsDict.processTitlePrefix}
          titleHighlight={channelsDict.processTitleHighlight}
          description={channelsDict.processDescription}
          align="center"
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-3">
          {channelsDict.processSteps.map((step) => (
            <article
              key={step.title}
              className="border-t border-brand-border py-6 md:px-6"
            >
              <CheckCircle2
                className="h-6 w-6 text-brand-primary"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-heading text-xl font-bold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-text-secondary">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactRequestInfoSection = () => {
  const pageDict = DICTIONARY.pages.contact;

  return (
    <section
      className="py-20 md:py-28"
      aria-labelledby="contact-request-info-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="contact-request-info-heading"
          eyebrow={pageDict.eyebrow}
          titlePrefix={pageDict.requestInfo.titlePrefix}
          titleHighlight={pageDict.requestInfo.titleHighlight}
          description={pageDict.requestInfo.description}
          align="center"
        />

        <div className="mx-auto max-w-4xl">
          <InfoListPanel items={pageDict.requestInfo.items} />
        </div>
      </div>
    </section>
  );
};

const ServiceAreasSection = ({ regions }: { regions: RegionDoc[] }) => {
  const pageDict = DICTIONARY.pages.contact;

  return (
    <section
      className="py-20 md:py-28"
      aria-labelledby="contact-service-areas-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          id="contact-service-areas-heading"
          eyebrow={pageDict.eyebrow}
          titlePrefix={pageDict.serviceAreas.titlePrefix}
          titleHighlight={pageDict.serviceAreas.titleHighlight}
          description={pageDict.serviceAreas.description}
          align="center"
        />

        <ServiceAreasPanel
          emptyText={pageDict.serviceAreas.empty}
          regions={regions}
        />
      </div>
    </section>
  );
};

const InfoListPanel = ({ items }: { items: readonly string[] }) => (
  <article>
    <ul className="flex flex-col border-y border-brand-border">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 border-b border-brand-border py-4 text-base text-text-secondary last:border-b-0"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </article>
);

const ServiceAreasPanel = ({
  emptyText,
  regions,
}: {
  emptyText: string;
  regions: RegionDoc[];
}) => (
  <article>
    {regions.length > 0 ? (
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
        {regions.map((region) => (
          <Link
            key={region.slug}
            href={`${ROUTES.regionBase}/${region.slug}`}
            className="rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:border-brand-primary/50 hover:text-brand-primary"
          >
            {region.name}
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-center text-sm text-text-secondary">{emptyText}</p>
    )}

    <Link
      href={ROUTES.regions}
      className="mx-auto mt-8 flex w-fit items-center gap-2 text-sm font-bold text-brand-primary transition-colors hover:text-brand-primary-hover"
    >
      {DICTIONARY.pages.contact.serviceAreas.allRegionsLink}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </article>
);

const ContactChannelCard = ({ channel }: { channel: ContactChannel }) => {
  const Icon = channel.icon;
  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-sm font-bold text-text-primary">
          {channel.title}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
          {channel.description}
        </span>
        <span className="mt-1.5 block break-words text-sm font-semibold text-brand-primary">
          {channel.value}
        </span>
        {channel.external && (
          <span className="mt-1 block text-xs font-bold text-brand-primary">
            {DICTIONARY.pages.contact.directions.label}
          </span>
        )}
      </span>
    </>
  );

  if (channel.href) {
    return (
      <a
        href={channel.href}
        target={channel.external ? "_blank" : undefined}
        rel={channel.external ? "noopener noreferrer" : undefined}
        aria-label={
          channel.external ? DICTIONARY.pages.contact.directions.aria : undefined
        }
        className="group flex gap-4 border-t border-brand-border py-5 transition-colors hover:border-brand-primary/50"
      >
        {content}
        {channel.external && (
          <ExternalLink
            className="ml-auto h-4 w-4 shrink-0 text-brand-primary"
            aria-hidden="true"
          />
        )}
      </a>
    );
  }

  return (
    <div className="flex gap-4 border-t border-brand-border py-5">
      {content}
    </div>
  );
};
