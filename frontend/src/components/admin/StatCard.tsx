"use client";

import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  subValue?: string;
  color?: string;
}

export function StatCard({ label, value, change, isPositive, icon: Icon, subValue, color = "violet" }: StatCardProps) {
  return (
    <div className="admin-glass rounded-2xl p-5 hover:border-white/10 transition-colors h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        {Icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color === "violet" ? "bg-violet-500/10 text-violet-400" :
            color === "blue" ? "bg-blue-500/10 text-blue-400" :
            color === "green" ? "bg-emerald-500/10 text-emerald-400" :
            "bg-orange-500/10 text-orange-400"
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <div className="flex items-center gap-2">
        {change && (
          <span className={cn(
            "text-[10px] font-semibold flex items-center gap-1",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {isPositive ? "↑" : "↓"} +{change}
          </span>
        )}
        {subValue && <span className="text-[10px] text-slate-500">{subValue}</span>}
      </div>
    </div>
  );
}
