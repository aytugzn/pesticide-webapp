import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICTIONARY } from "@/constants/dictionary";
import { PublicPageHeader } from "@/components/layouts/PublicPageHeader";
import { ContactSection } from "@/features/home/components/sections/ContactSection";
import { getGlobalData } from "@/features/settings/actions";

type PestPageProps = {
  params: Promise<{ pestSlug: string }>;
};

export const generateStaticParams = async () => {
  const { pests } = await getGlobalData();
  return pests.map((pest) => ({ pestSlug: pest.slug }));
};

export const generateMetadata = async ({ params }: PestPageProps): Promise<Metadata> => {
  const { pestSlug } = await params;
  const { pests } = await getGlobalData();
  const pest = pests.find((item) => item.slug === pestSlug);

  return {
    title: pest ? `${pest.name}${DICTIONARY.meta.regions.pestTitleSuffix} | ${DICTIONARY.global.brand}` : DICTIONARY.global.brand,
    description: pest?.description || DICTIONARY.home.services.defaultPestDesc,
  };
};

const PestPage = async ({ params }: PestPageProps) => {
  const { pestSlug } = await params;
  const { pests, regions } = await getGlobalData();
  const pest = pests.find((item) => item.slug === pestSlug);

  if (!pest) notFound();

  return (
    <>
      <PublicPageHeader
        eyebrow={DICTIONARY.navbar.links.services}
        title={`${pest.name} ${DICTIONARY.home.services.pestTitleSuffix}`}
        description={pest.description || DICTIONARY.home.services.defaultPestDesc}
      />
      <ContactSection pests={pests} regions={regions} />
    </>
  );
};

export default PestPage;
