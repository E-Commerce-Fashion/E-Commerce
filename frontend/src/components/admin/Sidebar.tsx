"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Store,
  LogOut,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useUserStore } from "@/store/userStore";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Package, label: "Products", href: "/admin/products" },
  { icon: ShoppingBag, label: "Orders", href: "/admin/orders" },
  { icon: Users, label: "Customers", href: "/admin/users" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout should still proceed locally if API call fails.
    } finally {
      clearUser();
      onClose();
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "admin-sidebar fixed left-0 bottom-0 top-16 z-40 w-64 sm:w-60 bg-[#0a0c18] border-r border-white/5 flex flex-col transition-transform duration-300 ease-out lg:sticky lg:top-16 lg:bottom-auto lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-14 sm:h-16 px-4 sm:px-5 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-violet-600 flex items-center justify-center text-white font-black text-xs">
              FF
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">FashionForge</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Admin Terminal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white lg:hidden p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-violet-600/15 text-violet-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4.25 h-4.25", isActive ? "text-violet-400" : "text-slate-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-2.5 border-t border-white/5 shrink-0 space-y-1.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Store className="w-4.25 h-4.25" />
            <span>View Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4.25 h-4.25" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
