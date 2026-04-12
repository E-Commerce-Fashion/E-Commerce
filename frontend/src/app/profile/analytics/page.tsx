"use client";

import AnalyticsPage from "@/app/admin/analytics/page";
import { AdminProfileShell } from "@/components/account/AdminProfileShell";

export default function ProfileAdminAnalyticsPage() {
  return (
    <AdminProfileShell
      title="Analytics"
      subtitle="Analyze performance metrics and revenue trends."
    >
      <AnalyticsPage />
    </AdminProfileShell>
  );
}
