"use client";

import { ProductManagementPanel } from "@/components/admin/ProductManagementPanel";
import { AdminProfileShell } from "@/components/account/AdminProfileShell";

export default function ProfileAdminProductsPage() {
  return (
    <AdminProfileShell
      title="Products"
      subtitle="Manage inventory, product updates, and protected delete flows."
    >
      <ProductManagementPanel />
    </AdminProfileShell>
  );
}
