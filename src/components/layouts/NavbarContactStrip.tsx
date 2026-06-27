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
        <div className="flex items-center justify-between text-xs font-semibold text-brand-primary">
          <div className="flex items-center gap-6">
            {phone && (
              <a
                href={phoneHref}
                className="flex items-center gap-1.5 hover:text-brand-primary-hover hover:opacity-80 transition-all"
              >
                <Phone className="w-3 h-3" aria-hidden="true" />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 hover:text-brand-primary-hover hover:opacity-80 transition-all"
              >
                <Mail className="w-3 h-3" aria-hidden="true" />
                {email}
              </a>
            )}
          </div>
          {workingHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {workingHours}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
