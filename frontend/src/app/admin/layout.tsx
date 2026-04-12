"use client";

import { useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";

/**
 * AdminLayout — Full-Width Admin Shell
 *
 * Keeps the admin area aligned under the global navbar while allowing
 * dashboard pages to occupy the full available viewport width and height.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-theme min-h-screen bg-[#07080e] text-slate-200">
      <main className="page-with-navbar-offset">
        <div className="admin-shell-surface w-full border-y border-white/5 bg-[#090b16]/85 backdrop-blur-xl overflow-hidden min-h-[calc(100vh-6.4rem)] sm:min-h-[calc(100vh-7rem)]">
          <div className="flex min-h-[calc(100vh-6.4rem)] sm:min-h-[calc(100vh-7rem)]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 min-w-0 flex flex-col">
              <TopBar onMenuClick={() => setSidebarOpen(true)} />

              <section className="flex-1 p-3 sm:p-4 lg:p-5">
                {children}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
