import { DICTIONARY } from "@/constants/dictionary";

/**
 * Normalizes a path into an absolute URL using the site's base URL.
 * Falls back to process.env.NEXT_PUBLIC_SITE_URL or DICTIONARY.global.siteUrl.
 */
export const getAbsoluteUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || DICTIONARY.global.siteUrl;
  
  // Ensure base URL doesn't have a trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  
  // Ensure path starts with a slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
};
