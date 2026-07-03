import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { DICTIONARY } from "@/constants/dictionary";
import { AppError } from "./exceptions";

const modelsCache = new Map<
  string,
  ReturnType<typeof GoogleGenerativeAI.prototype.getGenerativeModel>
>();

export const getGeminiApiKeys = (): string[] => {
  const keysEnv = process.env.GEMINI_API_KEYS || "";
  const keys = keysEnv.split(",").map(k => k.trim()).filter(Boolean);

  if (keys.length > 0) return keys;

  const singleKey = process.env.GEMINI_API_KEY?.trim();
  if (singleKey) return [singleKey];

  return [];
};

export const getGeminiModel = (apiKey?: string, modelName: string = DICTIONARY.gemini.model) => {
  const resolvedKey = apiKey || getGeminiApiKeys()[0];
  if (!resolvedKey) {
    throw new AppError(DICTIONARY.systemErrors.env.gemini, "ENV_MISSING");
  }

  const cacheKey = `${resolvedKey}_${modelName}`;
  if (modelsCache.has(cacheKey)) {
    return modelsCache.get(cacheKey)!;
  }

  const genAI = new GoogleGenerativeAI(resolvedKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  modelsCache.set(cacheKey, model);
  return model;
};

/**
 * Builds a strictly formatted prompt for Gemini AI to generate SEO content.
 *
 * @param region - Object containing region name and description
 * @param pest - Object containing pest name and description
 * @returns Formatted prompt string requesting JSON output
 */
export const buildCombinationPrompt = (
  region: { name: string; description: string },
  pest: { name: string; description: string },
): string => {
  return `
You are an expert SEO content writer and pest control specialist. Write in ${DICTIONARY.gemini.outputLanguage}.

Company: ${DICTIONARY.global.brand}, a premium, professional pest control company based in ${DICTIONARY.global.city}.
Region: ${region.name} (${region.description || "No specific details provided."})
Pest: ${pest.name} (${pest.description || "No specific details provided."})

CRITICAL RULES FOR CONTENT & FAQ:
1. Do NOT invent or guess specific operational details (e.g., exact prices, exact durations like "${DICTIONARY.gemini.promptExamples.duration}", or specific chemical names).
2. If addressing questions about time or price, give general professional answers (e.g., "${DICTIONARY.gemini.promptExamples.generalAnswer}").
3. Tone: Premium, trustworthy, and authoritative. Avoid keyword stuffing or sounding robotic. Write naturally to persuade the user to contact the company.

Generate the following fields:
- title: max 60 chars. Must be highly clickable and SEO optimized. Format MUST exactly end with " | ${DICTIONARY.global.brand}". Do not use "-" or any other format.
- description: max 150 chars. Comma separated list of specific environmental factors in this region that attract this specific pest. Do not write promotional text.
- h1: max 70 chars. Natural and engaging.
- metaDesc: max 160 chars. Must include a clear Call-To-Action (CTA) like "Hemen arayın", "İletişime geçin" (Do NOT use "ücretsiz teklif").
- content: 300-400 words. Naturally integrate region and pest details.
  - Format strictly as a flat list of semantic HTML tags (<p>, <h2>, <ul>).
  - DO NOT wrap the content in a single parent container like <div>, <main>, or <article>.
  - CRITICAL: You MUST start the content immediately with an <h2> tag. Do NOT write any introductory text or paragraph before the first <h2>. Do not use <h1> (the page already has an H1).
  - IMPORTANT: The very last <h2> section MUST be about the company itself (e.g., "${DICTIONARY.gemini.promptExamples.aboutCompanyHeading} ${DICTIONARY.global.brand}?").
- faq: 3 highly relevant question-answer pairs specific to the pest and/or region.

Return RAW JSON only. Do not wrap the JSON in markdown code blocks (e.g. no \`\`\`json). Do not add any conversational text before or after the JSON.
${DICTIONARY.gemini.jsonFormat}
  `.trim();
};

export const buildRegionPrompt = (region: {
  name: string;
  description: string;
}): string => {
  return `
You are an expert SEO content writer and pest control specialist. Write in ${DICTIONARY.gemini.outputLanguage}.

Company: ${DICTIONARY.global.brand}, a premium, professional pest control company based in ${DICTIONARY.global.city}.
Region: ${region.name} (${region.description || "No specific details provided."})

CRITICAL RULES FOR CONTENT & FAQ:
1. Do NOT invent or guess specific operational details (e.g., exact prices, exact durations like "${DICTIONARY.gemini.promptExamples.duration}", or specific chemical names).
2. If addressing questions about time or price, give general professional answers (e.g., "${DICTIONARY.gemini.promptExamples.generalAnswer}").
3. Tone: Premium, trustworthy, and authoritative. Avoid keyword stuffing or sounding robotic. Write naturally to persuade the user to contact the company.

Generate the following fields for a regional pest control landing page:
- title: max 60 chars. Must be highly clickable and SEO optimized. Format MUST exactly end with " | ${DICTIONARY.global.brand}". Do not use "-" or any other format.
- description: max 150 chars. Comma separated list of environmental, architectural, and geographical factors in this region that specifically increase PEST RISKS (e.g. "nemli sahil şeridi, eski altyapı, bahçeli müstakil evler, sıcak iklim, kanalizasyon sorunları"). Do not just describe the region's tourism or beauty. Focus strictly on factors relevant to pest control.
- h1: max 70 chars. Natural and engaging.
- metaDesc: max 160 chars. Must include a clear Call-To-Action (CTA) like "Hemen arayın", "İletişime geçin" (Do NOT use "ücretsiz teklif").
- content: 300-400 words. Describe pest control services in this specific region.
  - Format strictly as a flat list of semantic HTML tags (<p>, <h2>, <ul>).
  - DO NOT wrap the content in a single parent container like <div>, <main>, or <article>.
  - CRITICAL: You MUST start the content immediately with an <h2> tag. Do NOT write any introductory text or paragraph before the first <h2>. Do not use <h1> (the page already has an H1).
  - IMPORTANT: The very last <h2> section MUST be about the company itself (e.g., "${DICTIONARY.gemini.promptExamples.aboutCompanyHeading} ${DICTIONARY.global.brand}?").
- faq: 3 highly relevant question-answer pairs specific to pest control in this region.

Return RAW JSON only. Do not wrap the JSON in markdown code blocks (e.g. no \`\`\`json). Do not add any conversational text before or after the JSON.
${DICTIONARY.gemini.jsonFormat}
  `.trim();
};

export const buildPestPrompt = (pest: {
  name: string;
  description: string;
}): string => {
  return `
You are an expert SEO content writer and pest control specialist. Write in ${DICTIONARY.gemini.outputLanguage}.

Company: ${DICTIONARY.global.brand}, a premium, professional pest control company based in ${DICTIONARY.global.city}.
Pest: ${pest.name} (${pest.description || "No specific details provided."})

CRITICAL RULES FOR CONTENT & FAQ:
1. Do NOT invent or guess specific operational details (e.g., exact prices, exact durations like "${DICTIONARY.gemini.promptExamples.duration}", or specific chemical names).
2. If addressing questions about time or price, give general professional answers (e.g., "${DICTIONARY.gemini.promptExamples.generalAnswer}").
3. Tone: Premium, trustworthy, and authoritative. Avoid keyword stuffing or sounding robotic. Write naturally to persuade the user to contact the company.

Generate the following fields for a pest-specific informational and service landing page:
- title: max 60 chars. Must be highly clickable and SEO optimized. Format MUST exactly end with " | ${DICTIONARY.global.brand}". Do not use "-" or any other format.
- description: max 150 chars. Comma separated list of physical characteristics and common nesting areas for this pest (e.g. "bodrum, çatı ve depolarda yuvalanır, kışın kapalı alanlara girer"). Do not write promotional text.
- h1: max 70 chars. Natural and engaging.
- metaDesc: max 160 chars. Must include a clear Call-To-Action (CTA) like "Hemen arayın", "İletişime geçin" (Do NOT use "ücretsiz teklif").
- content: 300-400 words. Describe this pest, its dangers, and professional solutions.
  - Format strictly as a flat list of semantic HTML tags (<p>, <h2>, <ul>).
  - DO NOT wrap the content in a single parent container like <div>, <main>, or <article>.
  - CRITICAL: You MUST start the content immediately with an <h2> tag. Do NOT write any introductory text or paragraph before the first <h2>. Do not use <h1> (the page already has an H1).
  - IMPORTANT: The very last <h2> section MUST be about the company itself (e.g., "${DICTIONARY.gemini.promptExamples.aboutCompanyHeading} ${DICTIONARY.global.brand}?").
- faq: 3 highly relevant question-answer pairs specific to this pest.

Return RAW JSON only. Do not wrap the JSON in markdown code blocks (e.g. no \`\`\`json). Do not add any conversational text before or after the JSON.
${DICTIONARY.gemini.jsonFormat}
  `.trim();
};
