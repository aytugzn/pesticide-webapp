import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { DICTIONARY } from "@/constants/dictionary";
import { AppError } from "./exceptions";

const modelsCache = new Map<string, ReturnType<typeof GoogleGenerativeAI.prototype.getGenerativeModel>>();

export const getGeminiModel = (modelName: string = DICTIONARY.gemini.model) => {
  if (modelsCache.has(modelName)) {
    return modelsCache.get(modelName)!;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(DICTIONARY.systemErrors.env.gemini, "ENV_MISSING");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  modelsCache.set(modelName, model);
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
  pest: { name: string; description: string }
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
- title: max 60 chars. Must be highly clickable and SEO optimized.
- h1: max 70 chars. Natural and engaging.
- metaDesc: max 160 chars. Must include a clear Call-To-Action (CTA).
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
