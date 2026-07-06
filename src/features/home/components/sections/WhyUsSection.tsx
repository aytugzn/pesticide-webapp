import { DICTIONARY } from "@/constants/dictionary";
import { ImageSlider, type SliderImage } from "@/components/ui/ImageSlider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CheckListItem } from "@/components/ui/CheckListItem";

type WhyUsSectionProps = {
  /** Can be a single static URL or an array of images from CMS */
  images?: string | SliderImage[] | null;
}

export const WhyUsSection = ({
  images = "/ilaclama.png",
}: WhyUsSectionProps) => {
  const data = DICTIONARY.home.whyUs;

  // Robustly handle images whether it's a single static string, an array from admin, or empty
  const sliderImages: SliderImage[] = Array.isArray(images)
    ? images
    : typeof images === "string" && images.trim() !== ""
      ? [
          {
            id: "why-us-img",
            url: images,
            altText: data.title,
            title: data.title,
          },
        ]
      : [];

  return (
    <section className="bg-brand-surface border-y border-brand-border py-16 md:py-24" id="why-us" aria-labelledby="why-us-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left: Text & Image Content */}
          <div className="flex flex-col h-full">
            <SectionHeader
              id="why-us-heading"
              eyebrow={data.title}
              titlePrefix={data.titlePrefix}
              titleHighlight={data.titleHighlight}
              description={data.description}
            />

            {/* Image Frame */}
            <div className="w-full aspect-video rounded-lg overflow-hidden shadow-xl shadow-brand-primary/5 relative mt-auto hidden lg:block group border border-brand-border">
              <ImageSlider images={sliderImages} />
              <div
                className="absolute inset-0 border border-brand-surface/20 rounded-lg pointer-events-none z-10 mix-blend-overlay"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Right: Simple Check List */}
          <div className="grid grid-cols-1 gap-4">
            {data.steps.map((step) => (
              <CheckListItem 
                key={step.title}
                title={step.title}
                description={step.description}
                className="rounded-lg border border-brand-border bg-surface-neutral p-5 shadow-sm shadow-brand-primary/5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
