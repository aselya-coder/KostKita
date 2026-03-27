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
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend.isUp ? "+" : "-"}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link 
        to={to} 
        className={cn(
          "p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all block", 
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("p-6 rounded-2xl bg-card border border-border shadow-sm", className)}>
      {content}
    </div>
  );
}
