"use client";

import { AdminDashboardPanel } from "@/components/admin/AdminDashboardPanel";
import { AdminProfileShell } from "@/components/account/AdminProfileShell";

export default function ProfileAdminDashboardPage() {
  return (
    <AdminProfileShell
      title="Admin Dashboard"
      subtitle="Monitor revenue, orders, products, and customer growth in one place."
    >
      <AdminDashboardPanel />
    </AdminProfileShell>
  );
}
