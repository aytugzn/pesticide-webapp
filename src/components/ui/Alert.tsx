import { cn } from "@/utils/cn";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type AlertVariant = "success" | "error" | "info";

type AlertProps = {
  variant?: AlertVariant;
  message: string;
  className?: string;
}

export const Alert = ({ variant = "info", message, className }: AlertProps) => {
  const Icon =
    variant === "success"
      ? CheckCircle2
      : variant === "error"
        ? AlertCircle
        : Info;

  return (
    <div
      className={cn(
        "flex items-center p-4 rounded-xl border text-sm font-medium",
        variant === "success" &&
          "bg-success-bg border-success-border text-success-text",
        variant === "error" &&
          "bg-error-bg border-error-border text-error-text",
        variant === "info" && "bg-info-bg border-info-border text-info-text",
        className,
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
};
