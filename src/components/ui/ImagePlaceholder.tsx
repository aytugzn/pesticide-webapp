import { Bug, Ban } from "lucide-react";

export const ImagePlaceholder = () => {
  return (
    <div className="w-full h-full bg-surface-neutral flex items-center justify-center" aria-hidden="true">
      <div className="relative w-24 h-24 text-brand-primary opacity-20 flex items-center justify-center">
        <Bug className="absolute w-16 h-16" aria-hidden="true" />
        <Ban className="absolute w-full h-full" strokeWidth={1.5} aria-hidden="true" />
      </div>
    </div>
  );
};
