"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, PackageCheck, RefreshCw, Filter,
  ChevronDown, Search, Clock, CheckCircle2, XCircle,
  Truck, Package
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { formatCurrency, formatDate } from "@/utils";
import { cn } from "@/lib/utils";

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type AdminOrder = {
  id: string;
  user_id: string | null;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
  profiles?: { name?: string | null; phone?: string | null } | null;
};

const STATUS_OPTIONS: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_FILTER: Array<"all" | PaymentStatus> = ["all", "pending", "paid", "failed", "refunded"];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  placed: { label: "Placed", color: "bg-slate-500/15 text-slate-400", icon: Package },
  processing: { label: "Processing", color: "bg-amber-500/15 text-amber-400", icon: Clock },
  shipped: { label: "Shipped", color: "bg-blue-500/15 text-blue-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-rose-500/15 text-rose-400", icon: XCircle },
};

function getProfile(profiles: AdminOrder["profiles"]) {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles as any)[0] : profiles;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter !== "all") params.payment_status = paymentFilter;
      const { data } = await api.get("/admin/orders", { params });
      if (data.success) setOrders(data.data || []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "admin") { router.replace("/profile"); return; }
    fetchOrders();
  }, [hasHydrated, isAuthenticated, user?.role, statusFilter, paymentFilter]);

  const updateOrder = async (order: AdminOrder) => {
    const next = draftStatus[order.id] || order.order_status;
    if (next === order.order_status) return;
    setUpdatingId(order.id);
    try {
      const { data } = await api.put(`/admin/orders/${order.id}/status`, { order_status: next });
      if (data.success) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, order_status: next } : o));
        toast.success("Order status updated");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const profile = getProfile(o.profiles);
    return (
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (profile?.name || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Order Management</h2>
          <p className="text-slate-500 text-sm">Track and update order delivery pipeline.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-glass rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-45">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders or customers..."
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/40"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize bg-[#0a0c18]">{s}</option>)}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as any)}
          className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/40"
        >
          {PAYMENT_FILTER.map((s) => (
            <option key={s} value={s} className="bg-[#0a0c18]">{s === "all" ? "All Payments" : s}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="admin-glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                    <th className="px-5 py-4 font-semibold">Order</th>
                    <th className="px-4 py-4 font-semibold">Customer</th>
                    <th className="px-4 py-4 font-semibold">Date</th>
                    <th className="px-4 py-4 font-semibold">Amount</th>
                    <th className="px-4 py-4 font-semibold">Payment</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Update</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((order) => {
                    const profile = getProfile(order.profiles);
                    const selected = draftStatus[order.id] || order.order_status;
                    const cfg = statusConfig[order.order_status];
                    const StatusIcon = cfg.icon;

                    return (
                      <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-violet-400 font-semibold">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-slate-200 font-medium">{profile?.name || "Unknown"}</p>
                            <p className="text-[10px] text-slate-500">{order.user_id?.slice(0, 8) || "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-xs">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-4 font-semibold text-white">
                          {formatCurrency(Number(order.total_amount || 0))}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md",
                            order.payment_status === "paid"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : order.payment_status === "failed"
                              ? "bg-rose-500/15 text-rose-400"
                              : "bg-amber-500/15 text-amber-400"
                          )}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md w-fit", cfg.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={selected}
                              onChange={(e) => setDraftStatus((p) => ({ ...p, [order.id]: e.target.value as OrderStatus }))}
                              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500/40"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s} className="capitalize bg-[#0a0c18]">{s}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => updateOrder(order)}
                              disabled={updatingId === order.id || selected === order.order_status}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                            >
                              {updatingId === order.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <PackageCheck className="w-3 h-3" />}
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                No orders found
              </div>
            )}
            <div className="px-5 py-3 border-t border-white/5 text-xs text-slate-500">
              Showing {filtered.length} of {orders.length} orders
            </div>
          </>
        )}
      </div>
    </div>
  );
}
