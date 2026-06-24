"use client";

import { useEffect, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";

export const StickyMobileActions = ({ 
  telUrl, 
  whatsappUrl 
}: { 
  telUrl: string; 
  whatsappUrl: string; 
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroButtons = document.getElementById("hero-actions");
      if (heroButtons) {
        setIsVisible(heroButtons.getBoundingClientRect().bottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial state check on load

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-40 flex md:hidden transition-transform duration-300 ease-in-out shadow-2xl shadow-text-primary/10 border-t border-brand-border/20 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a 
        href={telUrl}
        className="flex-1 flex items-center justify-center gap-2 bg-brand-primary text-brand-surface py-5 font-bold text-sm tracking-wide"
      >
        <Phone className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span>{DICTIONARY.social.phone.callNow}</span>
      </a>
      <a 
        href={whatsappUrl}
        className="flex-1 flex items-center justify-center gap-2 bg-whatsapp hover:bg-whatsapp-hover text-brand-surface py-5 font-bold text-sm tracking-wide"
      >
        <MessageCircle className="w-5 h-5 fill-brand-surface"  aria-hidden="true" />
        <span>{DICTIONARY.social.whatsapp.text}</span>
      </a>
    </div>
  );
};
