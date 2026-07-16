import { Phone, Clock, Mail } from "lucide-react";

type NavbarContactStripProps = {
  phone?: string;
  phoneHref: string;
  workingHours?: string;
  email?: string;
};

export const NavbarContactStrip = ({
  phone,
  phoneHref,
  workingHours,
  email,
}: NavbarContactStripProps) => {
  if (!phone && !workingHours && !email) return null;

  return (
    <div className="hidden md:block bg-brand-primary/10 border-b border-brand-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 w-full">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 text-xs font-semibold text-brand-primary">
          <div className="min-w-0 flex flex-wrap items-start gap-x-6 gap-y-1">
            {phone && (
              <a
                href={phoneHref}
                className="min-w-0 flex items-start gap-1.5 break-words hover:text-brand-primary-hover hover:opacity-80 transition-all"
              >
                <Phone className="w-3 h-3" aria-hidden="true" />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="min-w-0 flex items-start gap-1.5 break-all hover:text-brand-primary-hover hover:opacity-80 transition-all"
              >
                <Mail className="w-3 h-3" aria-hidden="true" />
                {email}
              </a>
            )}
          </div>
          {workingHours && (
            <div className="ml-auto min-w-0 flex items-start gap-1.5 break-words text-right">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {workingHours}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
