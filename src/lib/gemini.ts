import { GoogleGenerativeAI } from "@google/generative-ai";
import { DICTIONARY } from "@/constants/dictionary";
import { AppError } from "./exceptions";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new AppError(DICTIONARY.systemErrors.env.gemini, "ENV_MISSING");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: DICTIONARY.gemini.model,
});

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
You are an SEO content writer. Write in ${DICTIONARY.gemini.outputLanguage}.

Company: DMR İlaçlama, a professional pest control company based in İzmir.

Region: ${region.name}
Region details: ${region.description}

Pest: ${pest.name}  
Pest details: ${pest.description}

Generate:
- title: max 60 chars
- h1: max 70 chars, natural and engaging
- metaDesc: max 160 chars, include a CTA
- content: 300-400 words, naturally integrate region and pest details, avoid template feel
- faq: 3 question-answer pairs

Return ONLY JSON, nothing else:
${DICTIONARY.gemini.jsonFormat}
  `.trim();
};
