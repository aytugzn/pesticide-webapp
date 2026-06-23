export type HeroSlideDoc = { 
  id?: string; 
  imageUrl: string; 
  altText?: string; 
  order: number; 
};

export type GoogleReviewDoc = {
  id: string;
  authorName: string;
  authorPhotoUrl: string;
  rating: number;
  text: string;
  relativeTimeDescription: string;
};

export type GoogleStatsDoc = {
  rating: string;
  reviewCount: string;
};
