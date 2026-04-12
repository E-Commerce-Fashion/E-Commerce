"use client";

import AdminCustomersPage from "@/app/admin/users/page";
import { AdminProfileShell } from "@/components/account/AdminProfileShell";

export default function ProfileAdminCustomersPage() {
  return (
    <AdminProfileShell
      title="Customers"
      subtitle="Review customer accounts and manage access roles."
    >
      <AdminCustomersPage />
    </AdminProfileShell>
  );
}
