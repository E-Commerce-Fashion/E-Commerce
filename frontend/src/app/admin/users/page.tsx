"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Search, UserCog, Shield, User as UserIcon,
  RefreshCw, ChevronDown, Mail, Phone, ShoppingBag
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";
import { formatCurrency, formatDate } from "@/utils";
import { cn } from "@/lib/utils";

type UserRole = "user" | "admin";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
};

export default function AdminCustomersPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<Record<string, UserRole>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 100 };
      if (roleFilter !== "all") params.role = roleFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get("/admin/users", { params });
      if (data.success) setUsers(data.data || []);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "admin") { router.replace("/profile"); return; }
    fetchUsers();
  }, [hasHydrated, isAuthenticated, user?.role, roleFilter, debouncedSearch]);

  const updateRole = async (record: AdminUser) => {
    const next = draftRole[record.id] || record.role;
    if (next === record.role) return;
    if (record.id === user?.id && next === "user") {
      toast.error("Cannot remove your own admin role");
      return;
    }
    setUpdatingId(record.id);
    try {
      const { data } = await api.put(`/admin/users/${record.id}/role`, { role: next });
      if (data.success) {
        setUsers((prev) => prev.map((u) => u.id === record.id ? { ...u, role: next } : u));
        toast.success("Role updated");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Customer Management</h2>
          <p className="text-slate-500 text-sm">Review accounts and manage roles.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-glass rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/40"
        >
          <option value="all" className="bg-[#0a0c18]">All Roles</option>
          <option value="user" className="bg-[#0a0c18]">Users</option>
          <option value="admin" className="bg-[#0a0c18]">Admins</option>
        </select>
      </div>

      {/* Table */}
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
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-4 py-4 font-semibold">Contact</th>
                    <th className="px-4 py-4 font-semibold">Joined</th>
                    <th className="px-4 py-4 font-semibold">Orders</th>
                    <th className="px-4 py-4 font-semibold">Spent</th>
                    <th className="px-4 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((record) => {
                    const selected = draftRole[record.id] || record.role;
                    return (
                      <tr key={record.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-500/20 shrink-0">
                              {(record.name || "U").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-slate-200 font-medium">{record.name || "Unnamed"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            {record.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Mail className="w-3 h-3 text-slate-600" />
                                {record.email}
                              </div>
                            )}
                            {record.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone className="w-3 h-3 text-slate-600" />
                                {record.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-xs">{formatDate(record.created_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                            {record.order_count ?? 0}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-white font-semibold">
                          {formatCurrency(Number(record.total_spent || 0))}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md w-fit",
                            record.role === "admin"
                              ? "bg-violet-500/15 text-violet-400"
                              : "bg-white/5 text-slate-400"
                          )}>
                            {record.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                            {record.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={selected}
                              onChange={(e) => setDraftRole((p) => ({ ...p, [record.id]: e.target.value as UserRole }))}
                              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-violet-500/40"
                            >
                              <option value="user" className="bg-[#0a0c18]">User</option>
                              <option value="admin" className="bg-[#0a0c18]">Admin</option>
                            </select>
                            <button
                              onClick={() => updateRole(record)}
                              disabled={updatingId === record.id || selected === record.role}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                            >
                              {updatingId === record.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <UserCog className="w-3 h-3" />}
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
            {users.length === 0 && (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                No customers found
              </div>
            )}
            <div className="px-5 py-3 border-t border-white/5 text-xs text-slate-500">
              {users.length} customers
            </div>
          </>
        )}
      </div>
    </div>
  );
}
