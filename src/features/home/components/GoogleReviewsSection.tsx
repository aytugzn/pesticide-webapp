import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Star } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import type { GoogleReviewDoc } from "@/features/home/types";

const MOCK_REVIEWS: GoogleReviewDoc[] = [
  {
    id: "1",
    authorName: "Ahmet Yılmaz",
    authorPhotoUrl: "https://ui-avatars.com/api/?name=Ahmet+Yilmaz&background=random",
    rating: 5,
    text: "Evimizdeki hamam böceği sorununu tek ilaçlamada çözdüler. Çok profesyonel ve temiz çalıştılar. Kesinlikle tavsiye ederim.",
    relativeTimeDescription: "1 hafta önce"
  },
  {
    id: "2",
    authorName: "Ayşe K.",
    authorPhotoUrl: "https://ui-avatars.com/api/?name=Ayse+K&background=random",
    rating: 5,
    text: "İşletmemiz için periyodik ilaçlama hizmeti alıyoruz. Hem çok ilgililer hem de kullandıkları ilaçlar Sağlık Bakanlığı onaylı olduğu için içimiz rahat.",
    relativeTimeDescription: "3 hafta önce"
  },
  {
    id: "3",
    authorName: "Mehmet Demir",
    authorPhotoUrl: "https://ui-avatars.com/api/?name=Mehmet+Demir&background=random",
    rating: 5,
    text: "Söyledikleri saatte geldiler, bütün evi detaylıca ilaçladılar. Süreç hakkında çok güzel bilgilendirdiler. Teşekkürler DMR İlaçlama.",
    relativeTimeDescription: "1 ay önce"
  },
  {
    id: "4",
    authorName: "Elif Şahin",
    authorPhotoUrl: "https://ui-avatars.com/api/?name=Elif+Sahin&background=random",
    rating: 5,
    text: "Yazlık evimizdeki karınca istilasından bizi kurtardılar. Fiyatları gayet makul ve verdikleri garanti belgesi güven veriyor.",
    relativeTimeDescription: "2 ay önce"
  },
  {
    id: "5",
    authorName: "Caner E.",
    authorPhotoUrl: "https://ui-avatars.com/api/?name=Caner+E&background=random",
    rating: 5,
    text: "Gece yarısı acil durum için aradığımızda bile hemen yardımcı oldular. Gerçekten işini hakkıyla yapan nadir firmalardan.",
    relativeTimeDescription: "3 ay önce"
  }
];

export const GoogleReviewsSection = ({ reviews = MOCK_REVIEWS }: { reviews?: GoogleReviewDoc[] }) => {
  return (
    <section id="google-reviews" className="w-full py-16 md:py-24 bg-surface-neutral border-t border-brand-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-8 h-8 md:w-10 md:h-10 fill-google-yellow text-google-yellow drop-shadow-sm" />
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-black text-text-primary">
            {DICTIONARY.home.googleReviews.title}
          </h2>
          <p className="text-text-secondary max-w-2xl text-lg">
            {DICTIONARY.home.googleReviews.description}
          </p>
        </div>

        {/* Reviews Marquee */}
        <div className="relative w-full overflow-hidden flex group py-4">
          {/* Gradient Masks for smooth fading edges (matches neutral background) */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 z-10 bg-gradient-to-r from-surface-neutral to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 z-10 bg-gradient-to-l from-surface-neutral to-transparent pointer-events-none"></div>

          {/* Scrolling Track */}
          <div className="flex gap-6 animate-marquee group-hover:[animation-play-state:paused] w-max">
            {/* We duplicate the reviews array to create a seamless infinite loop */}
            {[...reviews, ...reviews].map((review, idx) => (
              <ReviewCard key={`${review.id}-${idx}`} review={review} />
            ))}
          </div>
        </div>

        {/* View All Action */}
        <div className="mt-12 flex justify-center">
          <Button 
            variant="outline" 
            href="#" // Will be replaced with actual Google Maps link
            className="rounded-full px-8 py-6 font-bold shadow-sm"
            external
          >
            {DICTIONARY.home.googleReviews.viewAllButton}
          </Button>
        </div>

      </div>
    </section>
  );
};
