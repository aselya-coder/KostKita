import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
  to?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, className, to }: StatsCardProps) {
  const content = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full",
            trend.isUp ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            {trend.isUp ? "+" : "-"}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5 md:mb-1">{title}</h3>
        <p className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">{value}</p>
        {description && (
          <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1 md:mt-2 line-clamp-1">{description}</p>
        )}
      </div>
    </div>
  );

  const cardClasses = cn(
    "p-4 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group",
    className
  );

  if (to) {
    return (
      <Link to={to} className={cn("block", cardClasses)}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
}
