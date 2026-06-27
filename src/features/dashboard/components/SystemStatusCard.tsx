import { CheckCircle2 } from "lucide-react";

export type SystemStatusCardProps = {
  title: string;
  statusLabel: string;
};

const ICON_SIZE = 24;

export const SystemStatusCard = ({ title, statusLabel }: SystemStatusCardProps) => {
  return (
    <div className="group relative bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col transition-all duration-300 hover:shadow-md hover:border-success-border/50 overflow-hidden">
      {/* Decorative background glow on hover */}
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-success-bg opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-success-bg transition-transform duration-300 group-hover:scale-110">
          <CheckCircle2 size={ICON_SIZE} className="text-success-text" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-text-muted group-hover:text-text-primary transition-colors">
          {title}
        </h3>
      </div>
      <div className="relative z-10 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-border opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-success-text"></span>
        </span>
        <p className="text-lg font-bold text-text-primary">
          {statusLabel}
        </p>
      </div>
    </div>
  );
};
