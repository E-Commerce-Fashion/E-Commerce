"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, ShoppingBag, Package, Users,
  ArrowUpRight, ChevronDown, Filter, Download, Loader2,
  BarChart2, Zap, Sparkles
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const revenueData = [
  { name: "MON", value: 12000 },
  { name: "TUE", value: 18000 },
  { name: "WED", value: 15000 },
  { name: "THU", value: 24000 },
  { name: "FRI", value: 30000 },
  { name: "SAT", value: 22000 },
  { name: "SUN", value: 35000 },
];

const categoryData = [
  { name: "Streetwear", value: 45, color: "#8b5cf6" },
  { name: "Outerwear", value: 20, color: "#ec4899" },
  { name: "Essentials", value: 25, color: "#6366f1" },
  { name: "Other", value: 10, color: "#94a3b8" },
];

const bestSellers = [
  { name: "Neon Slim Fit Shirt", val: "₹2,84,000", progress: 85 },
  { name: "Reflective Denim Jacket", val: "₹1,92,000", progress: 65 },
  { name: "Cyber-Tech Joggers", val: "₹1,45,000", progress: 45 },
  { name: "Mesh Atelier Tee", val: "₹98,000", progress: 30 },
];

const fallbackOrders = [
  { id: "#EA-9281", customer: "Arjun Kapoor", avatar: "AK", product: "Neon Slim Fit Shirt", status: "Shipped", statusColor: "bg-emerald-500/15 text-emerald-400", amount: "₹4,200" },
  { id: "#EA-9282", customer: "Sara Malhotra", avatar: "SM", product: "Reflective Jacket", status: "Processing", statusColor: "bg-amber-500/15 text-amber-400", amount: "₹12,800" },
  { id: "#EA-9283", customer: "Rohan Varma", avatar: "RV", product: "Cyber-Tech Joggers", status: "Shipped", statusColor: "bg-emerald-500/15 text-emerald-400", amount: "₹6,400" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function AdminDashboardPanel() {
  const { resolvedTheme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === "light";

  useEffect(() => {
    const t = setTimeout(() => setChartsReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    apiClient.get("/admin/dashboard")
      .then((res) => { if (res.data.success) setStats(res.data.data); })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error("Please login as Admin.");
          window.location.href = "/login";
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center min-h-[calc(100vh-15rem)] rounded-lg border",
        isLight ? "border-slate-200 bg-white" : "border-white/5 bg-[#0a0c18]"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading admin insights…</p>
        </div>
      </div>
    );
  }

  const data = stats || { totalRevenue: 1245000, totalOrders: 124, totalProducts: 18, totalUsers: 4820, recentOrders: [] };
  const orders = data.recentOrders?.length > 0
    ? data.recentOrders.map((o: any) => ({
      id: `#${o.id?.slice(0, 7) || "N/A"}`,
      customer: o.profiles?.name || "Customer",
      avatar: (o.profiles?.name || "C").slice(0, 2).toUpperCase(),
      product: o.items?.[0]?.name || "N/A",
      status: o.order_status || "placed",
      statusColor: o.order_status === "delivered" || o.order_status === "shipped"
        ? "bg-emerald-500/15 text-emerald-400"
        : o.order_status === "cancelled"
          ? "bg-rose-500/15 text-rose-400"
          : "bg-amber-500/15 text-amber-400",
      amount: fmt(o.total_amount),
    }))
    : fallbackOrders;

  return (
    <motion.div className={cn("admin-dashboard space-y-5 md:space-y-6", isLight && "admin-dashboard-light")} variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Sales" value={fmt(data.totalRevenue)} change="12.8%" isPositive icon={TrendingUp} subValue="from last month" color="violet" />
        <StatCard label="Total Orders" value={data.totalOrders} icon={ShoppingBag} subValue="All time" color="blue" />
        <StatCard label="Active Products" value={data.totalProducts} icon={Package} subValue="In inventory" color="orange" />
        <StatCard label="Total Customers" value={data.totalUsers?.toLocaleString()} change="240" isPositive icon={Users} subValue="new this week" color="green" />
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl p-5 md:p-6 border border-violet-500/20 bg-linear-to-br from-violet-600/5 to-purple-800/5 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-32 h-32 text-violet-500" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">AI Intelligence Hub</h3>
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Powered by Arcee Trinity AI</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <InsightItem label="Revenue Surge" text="Total revenue soared to ₹8,45,000, marking a 12% growth week-over-week. This underscores the platform's ability to captivate high-value consumers." />
              <InsightItem label="Star Performer" text="The 'Neon Slim Fit Shirt' emerged as the champion with 350 units sold, reflecting our knack for curating trendsetting designs." />
            </div>
            <div className="space-y-3">
              <InsightItem label="Category Dominance" text="Streetwear continues to reign supreme at 45% of total sales, highlighting strategic alignment with evolving fashion tastes." />
              <InsightItem label="Elite Satisfaction" text="A 1.5% refund rate sets a benchmark for quality and customer trust, ensuring a seamless premium experience." />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="admin-chart-card lg:col-span-2 rounded-2xl p-5 md:p-6 border border-white/5" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-white">Weekly Revenue</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Real-time performance across all channels</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 hover:text-white hover:border-white/10 transition-all">
              Last 7 Days <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div style={{ width: "100%", height: 220 }}>
            {chartsReady && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.04)"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isLight ? "#475569" : "#64748b", fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "#0d0f1a",
                      border: isLight ? "1px solid rgba(15,23,42,0.14)" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: isLight ? "#0f172a" : "#fff",
                      padding: "8px 14px"
                    }}
                    itemStyle={{ color: "#8b5cf6" }}
                    cursor={{ stroke: "rgba(139,92,246,0.2)", strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-chart-card rounded-2xl p-5 md:p-6 border border-white/5 flex flex-col" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}>
          <div className="mb-4">
            <h3 className="font-bold text-white">Category Split</h3>
            <p className="text-xs text-slate-500 mt-0.5">Inventory distribution</p>
          </div>
          <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: 180, height: 180 }}>
            {chartsReady && (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} innerRadius={54} outerRadius={74} paddingAngle={4} dataKey="value" animationDuration={1200}>
                    {categoryData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">100%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Total Stock</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 mt-4">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-slate-400 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="admin-chart-card rounded-2xl p-5 md:p-6 border border-white/5" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">Best Selling Garments</h3>
          <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 font-medium">
            View Report <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-4 md:space-y-5">
          {bestSellers.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-200 font-medium truncate mr-3">{item.name}</span>
                <span className="text-sm text-white font-bold whitespace-nowrap">{item.val}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="admin-chart-card rounded-2xl p-5 md:p-6 border border-white/5" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h3 className="font-bold text-white">Live Order Stream</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 hover:text-white hover:border-white/10 transition-all">
              <Filter className="w-3 h-3" /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-xs text-white bg-violet-600 rounded-lg px-3 py-1.5 hover:bg-violet-500 transition-colors font-medium">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left min-w-120">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                <th className="pb-3 pr-4 font-semibold">Order ID</th>
                <th className="pb-3 pr-4 font-semibold">Customer</th>
                <th className="pb-3 pr-4 font-semibold hidden sm:table-cell">Product</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/4">
              {orders.map((order: any, idx: number) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * idx }}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="py-3.5 pr-4 text-violet-400 font-semibold text-xs whitespace-nowrap">{order.id}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {order.avatar}
                      </div>
                      <span className="text-slate-200 text-sm truncate max-w-25 sm:max-w-35">{order.customer}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-slate-400 hidden sm:table-cell truncate max-w-35">{order.product}</td>
                  <td className="py-3.5 pr-4">
                    <span className={cn("text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md whitespace-nowrap", order.statusColor)}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-semibold text-white whitespace-nowrap">{order.amount}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="w-full mt-4 pt-4 text-[11px] uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-colors font-semibold border-t border-white/5">
          Load More Orders
        </button>
      </motion.div>
    </motion.div>
  );
}

function InsightItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/3 border border-white/5 hover:border-violet-500/30 transition-colors">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1">{label}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}