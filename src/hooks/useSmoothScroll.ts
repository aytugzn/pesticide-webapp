"use client";

import { useCallback } from "react";

export const useSmoothScroll = () => {
  const scrollTo = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    let rafId: number | null = null;
    let isInterrupted = false;

    const handleUserInterrupt = () => {
      isInterrupted = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      removeInterruptListeners();
    };

    const addInterruptListeners = () => {
      window.addEventListener("touchstart", handleUserInterrupt, { passive: true });
      window.addEventListener("wheel", handleUserInterrupt, { passive: true });
      window.addEventListener("mousedown", handleUserInterrupt, { passive: true });
    };

    const removeInterruptListeners = () => {
      window.removeEventListener("touchstart", handleUserInterrupt);
      window.removeEventListener("wheel", handleUserInterrupt);
      window.removeEventListener("mousedown", handleUserInterrupt);
    };

    const navbar = document.querySelector("header") || document.querySelector("nav");
    const offset = navbar ? navbar.getBoundingClientRect().height : 80;

    const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
    const windowHeight = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - windowHeight;
    const targetScrollY = Math.min(Math.max(0, absoluteTop - offset), maxScroll);

    const startY = window.scrollY;
    const distance = targetScrollY - startY;

    if (Math.abs(distance) < 5) return;

    const duration = Math.min(Math.max(Math.abs(distance) / 2, 400), 1000);
    let startTime: number | null = null;

    const animateScroll = (currentTime: number) => {
      if (isInterrupted) return;
      if (!startTime) startTime = currentTime;

      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      window.scrollTo(0, startY + distance * ease);

      if (progress < 1) {
        rafId = requestAnimationFrame(animateScroll);
      } else {
        removeInterruptListeners();
      }
    };

    addInterruptListeners();
    rafId = requestAnimationFrame(animateScroll);
  }, []);

  return scrollTo;
};