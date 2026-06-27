import { LucideIcon } from "lucide-react";

export type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
};

const ICON_SIZE = 24;

export const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: StatCardProps) => {
  return (
    <div className="group relative bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col transition-all duration-300 hover:shadow-md hover:border-brand-primary/30 overflow-hidden">
      {/* Decorative background glow on hover */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full ${bgClass} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl pointer-events-none`} aria-hidden="true" />
      
      <div className="relative z-10 flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${bgClass}`}>
          <Icon size={ICON_SIZE} className={colorClass} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-text-muted group-hover:text-text-primary transition-colors">
          {title}
        </h3>
      </div>
      <p className="relative z-10 text-3xl font-bold text-text-primary">
        {value}
      </p>
    </div>
  );
};
