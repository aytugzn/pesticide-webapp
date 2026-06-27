"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { loadCombination } from "../actions";
import { DICTIONARY } from "@/constants/dictionary";

type Feedback = { type: "success" | "error"; message: string };

type CombinationContentOptions = {
  selectedRegion: string;
  selectedPest: string;
  onFeedback: (feedback: Feedback | null) => void;
};

/**
 * Manages all editable content fields (title, h1, metaDesc, content, faq, isActive).
 * Handles:
 *  - Loading existing content from Firestore via loadCombination
 *  - Restoring and auto-saving unsaved drafts via localStorage
 *  - FAQ item updates
 *  - Content clearing on save
 */
export const useCombinationContent = ({
  onFeedback,
}: Omit<CombinationContentOptions, "selectedRegion" | "selectedPest">) => {
  const d = DICTIONARY.admin.combinations;

  const [title, setTitle] = useState("");
  const [h1, setH1] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [content, setContent] = useState("");
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Use a ref to track which combination the current content actually belongs to.
  // This prevents saving old content into a newly selected region's draft key during state transitions.
  const loadedComboRef = useRef<{ region: string; pest: string } | null>(null);
  
  // Prevents race conditions if multiple loadContent requests are fired rapidly
  const currentLoadId = useRef(0);

  const hasContent = !!(title || h1 || metaDesc || content);

  /** Populates all content fields from a data object. */
  const populateContent = useCallback(
    (data: { title?: string; h1?: string; metaDesc?: string; content?: string; faq?: { question: string; answer: string }[]; isActive?: boolean }) => {
      setTitle(data.title || "");
      setH1(data.h1 || "");
      setMetaDesc(data.metaDesc || "");
      setContent(data.content || "");
      setFaq(data.faq || []);
      setIsActive(data.isActive ?? true);
    },
    [],
  );

  /** Clears all content fields to their initial empty state. */
  const clearContent = useCallback(() => {
    setTitle("");
    setH1("");
    setMetaDesc("");
    setContent("");
    setFaq([]);
    setIsActive(true);
  }, []);

  /**
   * Loads existing combination from Firestore.
   * Falls back to localStorage draft if no DB record exists.
   * Clears fields if neither source has data.
   */
  const loadContent = useCallback(
    async (regionSlug: string, pestSlug: string) => {
      if (!regionSlug || !pestSlug) return;
      const loadId = ++currentLoadId.current;

      onFeedback(null);
      const result = await loadCombination(regionSlug, pestSlug);

      if (loadId !== currentLoadId.current) return;

      if (result.success && result.data) {
        loadedComboRef.current = { region: regionSlug, pest: pestSlug };
        populateContent(result.data);
        onFeedback({ type: "success", message: d.successLoad });
        return;
      }

      // Check for unsaved draft in localStorage
      const draftKey = `admin_combo_draft_${regionSlug}_${pestSlug}`;
      const draftJson = localStorage.getItem(draftKey);

      if (draftJson) {
        try {
          const draft = JSON.parse(draftJson);
          loadedComboRef.current = { region: regionSlug, pest: pestSlug };
          populateContent(draft);
          onFeedback({ type: "success", message: d.draftRestored });
          return;
        } catch (e) {
          console.error(DICTIONARY.systemErrors.logs.draftParse, e);
        }
      }

      // No existing content & no draft — clear for fresh generation
      loadedComboRef.current = { region: regionSlug, pest: pestSlug };
      clearContent();
    },
    [d.successLoad, d.draftRestored, onFeedback, populateContent, clearContent],
  );

  /** Auto-saves a draft to localStorage whenever content changes, and removes it when cleared. */
  useEffect(() => {
    if (!loadedComboRef.current) return;
    const draftKey = `admin_combo_draft_${loadedComboRef.current.region}_${loadedComboRef.current.pest}`;
    
    if (!hasContent) {
      localStorage.removeItem(draftKey);
      return;
    }
    
    localStorage.setItem(draftKey, JSON.stringify({ title, h1, metaDesc, content, faq }));
  }, [title, h1, metaDesc, content, faq, hasContent]);

  /** Updates a single FAQ item's question or answer field. */
  const handleFaqChange = useCallback(
    (index: number, field: "question" | "answer", value: string) => {
      setFaq((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  return {
    title, setTitle,
    h1, setH1,
    metaDesc, setMetaDesc,
    content, setContent,
    faq, setFaq,
    isActive, setIsActive,
    hasContent,
    loadContent,
    clearContent,
    populateContent,
    handleFaqChange,
  };
};

export type CombinationContent = ReturnType<typeof useCombinationContent>;
