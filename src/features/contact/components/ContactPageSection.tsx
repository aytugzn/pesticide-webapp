import { DICTIONARY } from "@/constants/dictionary";
import { DEFAULT_PHONE } from "@/constants/ui";
import { ContactForm } from "@/features/home/components/ContactForm";
import { generateTelUrl, generateWhatsAppUrl } from "@/utils/phone";
import { InstagramIcon, FacebookIcon } from "@/components/ui/Icons";
import {
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
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
  icon: LucideIcon | ComponentType<{ className?: string }>;
};

export const ContactPageSection = ({
  pests,
  regions,
  settings,
}: ContactPageSectionProps) => {
  const data = DICTIONARY.home.contact;
  const channelsDict = data.channels;
  const phone = settings?.phone || DEFAULT_PHONE;
  const email = settings?.email || DICTIONARY.footer.contact.email;
  const address = settings?.address || DICTIONARY.global.contact.address;
  const instagramUrl =
    settings?.instagramUrl || DICTIONARY.social.instagram.url;
  const facebookUrl = settings?.facebookUrl || DICTIONARY.social.facebook.url;
  const channels: ContactChannel[] = [
    {
      title: channelsDict.phoneTitle,
      description: channelsDict.phoneDesc,
      value: phone,
      href: generateTelUrl(phone),
      icon: Phone,
    },
    {
      title: channelsDict.whatsappTitle,
      description: channelsDict.whatsappDesc,
      value: DICTIONARY.social.whatsapp.text,
      href: generateWhatsAppUrl(phone),
      icon: MessageCircle,
    },
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

  return (
    <section className="bg-surface-neutral py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="lg:col-span-5">
            <div className="rounded-lg border border-brand-border bg-brand-surface p-5 sm:p-6">
              <h2 className="font-heading text-2xl font-bold text-text-primary">
                {channelsDict.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {channelsDict.description}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {channels.map((channel) => (
                  <ContactChannelCard key={channel.title} channel={channel} />
                ))}
              </div>
            </div>
          </aside>

          <div className="flex h-full flex-col gap-5 lg:col-span-7">
            <ContactForm
              pests={pests}
              regions={regions}
              className="max-w-none rounded-lg shadow-none"
            />

            <div className="flex flex-1 flex-col rounded-lg border border-brand-border bg-brand-surface p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-text-primary">
                {channelsDict.processTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {channelsDict.processDescription}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {channelsDict.processSteps.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-lg border border-brand-border bg-surface-neutral p-4"
                  >
                    <CheckCircle2
                      className="h-5 w-5 text-brand-primary"
                      aria-hidden="true"
                    />
                    <h3 className="mt-3 font-heading text-sm font-bold text-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-xs">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

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
      </span>
    </>
  );

  if (channel.href) {
    return (
      <a
        href={channel.href}
        className="group flex gap-3 rounded-lg border border-brand-border bg-surface-neutral p-3 transition-colors hover:border-brand-primary/50 hover:bg-brand-surface-muted"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex gap-3 rounded-lg border border-brand-border bg-surface-neutral p-3">
      {content}
    </div>
  );
};
