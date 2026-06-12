import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "primary" | "gold" | "danger" | "default";
}

const accentBg: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  gold: "bg-accent/15 text-accent",
  danger: "bg-danger/10 text-danger",
  default: "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, sub, trend, accent = "default" }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", accentBg[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        {sub && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              trend === "up" && "bg-success/10 text-success",
              trend === "down" && "bg-danger/10 text-danger",
              (!trend || trend === "neutral") && "bg-muted text-muted-foreground",
            )}
          >
            {sub}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}
