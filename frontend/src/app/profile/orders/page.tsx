"use client";

import AdminOrdersPage from "@/app/admin/orders/page";
import { AdminProfileShell } from "@/components/account/AdminProfileShell";

export default function ProfileAdminOrdersPage() {
  return (
    <AdminProfileShell
      title="Orders"
      subtitle="Track order lifecycle and update fulfillment statuses."
    >
      <AdminOrdersPage />
    </AdminProfileShell>
  );
}
