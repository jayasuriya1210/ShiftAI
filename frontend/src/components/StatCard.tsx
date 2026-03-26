import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  glowColor?: "blue" | "purple" | "cyan" | "green" | "amber" | "red";
}

const glowMap = {
  blue: "neon-glow-blue",
  purple: "neon-glow-purple",
  cyan: "",
  green: "",
  amber: "",
  red: "",
};

const iconBgMap = {
  blue: "bg-neon-blue/10 text-neon-blue",
  purple: "bg-neon-purple/10 text-neon-purple",
  cyan: "bg-neon-cyan/10 text-neon-cyan",
  green: "bg-neon-green/10 text-neon-green",
  amber: "bg-neon-amber/10 text-neon-amber",
  red: "bg-neon-red/10 text-neon-red",
};

export function StatCard({ title, value, icon, trend, trendUp, glowColor = "blue" }: StatCardProps) {
  return (
    <div className={`glass-card-hover p-5 ${glowMap[glowColor]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trendUp ? "text-neon-green" : "text-neon-red"}`}>
              {trendUp ? "Up" : "Down"} {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgMap[glowColor]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
