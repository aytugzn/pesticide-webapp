"use client";

import { useState, useEffect } from "react";
import { Phone, Clock, Mail } from "lucide-react";
import { NAVBAR_SCROLL_THRESHOLD } from "@/constants/ui";

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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide strip after scrolling past the defined threshold
      setIsVisible(window.scrollY <= NAVBAR_SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!phone && !workingHours && !email) return null;

  return (
    <div
      className={`hidden md:block bg-brand-primary/10 overflow-hidden transition-all duration-500 ease-in-out ${
        isVisible ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-6">
        <div className="flex items-center justify-between h-full text-xs font-semibold text-brand-primary">
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
