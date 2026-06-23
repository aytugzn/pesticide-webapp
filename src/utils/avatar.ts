/**
 * Generates an avatar URL for a user.
 * Falls back to UI-Avatars if no photo URL is provided.
 * 
 * @param name - The name of the user to generate initials for
 * @param photoUrl - Optional Google photo URL
 * @returns The final avatar image URL
 */
export const getAvatarUrl = (name: string, photoUrl?: string | null): string => {
  if (photoUrl) return photoUrl;
  
  // Fallback to UI-Avatars if no photo is provided
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};
