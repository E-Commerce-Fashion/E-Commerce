"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import apiClient from "@/lib/apiClient";
import { useUserStore } from "@/store/userStore";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const weeklyData = [
  { day: "Mon", revenue: 42000, orders: 12 },
  { day: "Tue", revenue: 68000, orders: 18 },
  { day: "Wed", revenue: 55000, orders: 15 },
  { day: "Thu", revenue: 92000, orders: 24 },
  { day: "Fri", revenue: 120000, orders: 30 },
  { day: "Sat", revenue: 88000, orders: 22 },
  { day: "Sun", revenue: 145000, orders: 35 },
];

const categoryBreakdown = [
  { name: "Streetwear", value: 45, color: "#8b5cf6" },
  { name: "Essentials", value: 25, color: "#6366f1" },
  { name: "Outerwear",  value: 20, color: "#ec4899" },
  { name: "Other",      value: 10, color: "#94a3b8" },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useUserStore();
  const [stats,       setStats      ] = useState<any>(null);
  const [loading,     setLoading    ] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  /* Defer Recharts until layout is fully settled (800ms) */
  useEffect(() => {
    const t = setTimeout(() => setChartsReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "admin") { router.replace("/profile"); return; }

    apiClient.get("/admin/dashboard")
      .then((r) => { if (r.data.success) setStats(r.data.data); })
      .catch((e) => {
        if (e.response?.status === 401) { toast.error("Unauthorized"); router.replace("/login"); }
      })
      .finally(() => setLoading(false));
  }, [hasHydrated, isAuthenticated, user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
      </div>
    );
  }

  const d = stats || { totalRevenue: 1245000, totalOrders: 124, totalProducts: 18, totalUsers: 4820 };

  const kpis = [
    { label: "Total Revenue",    value: formatCurrency(d.totalRevenue),          change: "+14.2%", up: true,  icon: TrendingUp,  color: "text-violet-400 bg-violet-500/10"  },
    { label: "Total Orders",     value: d.totalOrders,                            change: "+5.8%",  up: true,  icon: ShoppingBag, color: "text-blue-400 bg-blue-500/10"      },
    { label: "Products Listed",  value: d.totalProducts,                          change: "+2",     up: true,  icon: Package,     color: "text-orange-400 bg-orange-500/10"  },
    { label: "Total Customers",  value: d.totalUsers?.toLocaleString(),           change: "+128",   up: true,  icon: Users,       color: "text-emerald-400 bg-emerald-500/10"},
  ];

  const tooltipStyle = {
    contentStyle: { backgroundColor: "#0d0f1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", color: "#fff", padding: "8px 14px" },
    cursor: { stroke: "rgba(139,92,246,0.2)", strokeWidth: 1 },
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-slate-500 text-sm">Performance metrics across all channels.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl p-4 md:p-5 border border-white/5"
               style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-tight">{k.label}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", k.color)}>
                <k.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white">{k.value}</p>
            <div className={cn("flex items-center gap-1 text-xs font-semibold mt-1.5", k.up ? "text-emerald-400" : "text-rose-400")}>
              {k.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {k.change} from last period
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl p-5 md:p-6 border border-white/5"
           style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
        <div className="mb-5">
          <h3 className="font-bold text-white">Weekly Revenue</h3>
          <p className="text-xs text-slate-500 mt-0.5">Revenue and order volume this week</p>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          {chartsReady && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="anaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8} />
                <YAxis hide />
                <Tooltip {...tooltipStyle} itemStyle={{ color: "#8b5cf6" }} formatter={(v: any) => [formatCurrency(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#anaGrad)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Orders Chart + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="rounded-2xl p-5 md:p-6 border border-white/5"
             style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
          <h3 className="font-bold text-white mb-5">Daily Orders</h3>
          <div style={{ width: '100%', height: 200 }}>
            {chartsReady && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8} />
                  <YAxis hide />
                  <Tooltip {...tooltipStyle} itemStyle={{ color: "#8b5cf6" }} formatter={(v: any) => [v, "Orders"]} />
                  <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill={i === 6 ? "#8b5cf6" : "rgba(139,92,246,0.3)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl p-5 md:p-6 border border-white/5"
             style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
          <h3 className="font-bold text-white mb-5">Category Breakdown</h3>
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="text-white font-semibold">{cat.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
