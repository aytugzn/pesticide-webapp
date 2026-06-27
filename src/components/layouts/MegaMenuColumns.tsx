import { Bug, MapPin } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { NAVBAR_DROPDOWN_MAX_ITEMS } from "@/constants/ui";
import { MegaMenuColumn } from "./MegaMenuColumn";
import type { PestDoc, RegionDoc } from "@/types";

type MegaMenuColumnsProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
  variant?: "desktop" | "mobile";
  onItemClick?: () => void;
};

export const MegaMenuColumns = ({
  pests,
  regions,
  variant = "desktop",
  onItemClick,
}: MegaMenuColumnsProps) => {
  return (
    <>
      <MegaMenuColumn
        variant={variant}
        title={DICTIONARY.navbar.columns.pests}
        icon={Bug}
        items={pests}
        emptyStateMessage={DICTIONARY.navbar.emptyStates.pests}
        baseRoute={ROUTES.pestBase}
        itemIcon={variant === "mobile" ? Bug : undefined}
        onItemClick={onItemClick}
        maxItems={NAVBAR_DROPDOWN_MAX_ITEMS}
        viewAllText={DICTIONARY.navbar.columns.viewAllPests}
        viewAllRoute={ROUTES.services}
      />

      <MegaMenuColumn
        variant={variant}
        title={DICTIONARY.navbar.columns.regions}
        icon={MapPin}
        items={regions}
        emptyStateMessage={DICTIONARY.navbar.emptyStates.regions}
        baseRoute={ROUTES.regionBase}
        itemIcon={variant === "mobile" ? MapPin : undefined}
        onItemClick={onItemClick}
        maxItems={NAVBAR_DROPDOWN_MAX_ITEMS}
        viewAllText={DICTIONARY.navbar.columns.viewAllRegions}
        viewAllRoute={ROUTES.regions}
      />
    </>
  );
};
