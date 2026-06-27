"use client";

import { useState, useCallback } from "react";

/**
 * Manages region/pest selection state and persists the last selection
 * to localStorage for seamless UX on page reload.
 */
export const useCombinationSelection = () => {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPest, setSelectedPest] = useState("");

  const handleRegionChange = useCallback((value: string) => {
    setSelectedRegion(value);
    localStorage.setItem("admin_combo_last_region", value);
  }, []);

  const handlePestChange = useCallback((value: string) => {
    setSelectedPest(value);
    localStorage.setItem("admin_combo_last_pest", value);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRegion("");
    setSelectedPest("");
    localStorage.removeItem("admin_combo_last_region");
    localStorage.removeItem("admin_combo_last_pest");
  }, []);

  /** Restores the last selected combination from localStorage on mount. */
  const getLastSelection = useCallback(() => {
    const lastRegion = localStorage.getItem("admin_combo_last_region");
    const lastPest = localStorage.getItem("admin_combo_last_pest");
    return lastRegion && lastPest ? { lastRegion, lastPest } : null;
  }, []);

  return {
    selectedRegion,
    selectedPest,
    handleRegionChange,
    handlePestChange,
    clearSelection,
    getLastSelection,
    setSelectedRegion,
    setSelectedPest,
  };
};

export type CombinationSelection = ReturnType<typeof useCombinationSelection>;
