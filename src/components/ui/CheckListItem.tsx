import { CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export type CheckListItemProps = {
  title: string;
  description: string;
  className?: string;
};

export const CheckListItem = ({
  title,
  description,
  className,
}: CheckListItemProps) => {
  return (
    <div className={cn("flex items-start", className)}>
      <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-brand-primary mt-1 md:mt-0.5 mr-4 md:mr-6 flex-shrink-0" />
      <div>
        <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-base md:text-lg text-text-secondary">
          {description}
        </p>
      </div>
    </div>
  );
};
