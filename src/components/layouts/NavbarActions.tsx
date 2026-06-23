"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";

const SCROLL_THRESHOLD = 400;

export const NavbarActions = ({ whatsappUrl, telUrl }: { whatsappUrl: string; telUrl: string }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show buttons after scrolling past the defined threshold
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={`hidden md:flex items-center gap-3 transition-all duration-500 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <Button 
        href={whatsappUrl} 
        variant="icon"
        size="icon"
        external
        aria-label={DICTIONARY.navbar.whatsappAria}
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
      
      <a 
        href={telUrl} 
        className="flex items-center gap-2 px-5 py-2.5 rounded-brand-md bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary-hover transition-colors shadow-sm"
      >
        <Phone className="w-4 h-4 fill-white/20" />
        <span>{DICTIONARY.navbar.callNow}</span>
      </a>
    </div>
  );
};
