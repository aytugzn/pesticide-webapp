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
        aria-label={DICTIONARY.social.whatsapp.aria}
      >
        <MessageCircle className="w-5 h-5"  aria-hidden="true" />
      </Button>
      
      <Button 
        href={telUrl} 
        variant="primary"
      >
        <Phone className="w-5 h-5" aria-hidden="true" />
        <span>{DICTIONARY.social.phone.callNow}</span>
      </Button>
    </div>
  );
};
