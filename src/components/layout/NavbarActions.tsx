"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DICTIONARY } from "@/constants/dictionary";
import { NAVBAR_SCROLL_THRESHOLD } from "@/constants/ui";

export const NavbarActions = ({ whatsappUrl, telUrl }: { whatsappUrl: string; telUrl: string }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Use hysteresis (deadband) to prevent infinite loop flickering
      // when the sticky header's height changes.
      if (currentScrollY > NAVBAR_SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else if (currentScrollY < NAVBAR_SCROLL_THRESHOLD - 50) {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={`hidden lg:flex items-center gap-3 transition-all duration-500 transform ${
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
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
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
