"use client";

import SettingsPage from "@/app/admin/settings/page";
import { AdminProfileShell } from "@/components/account/AdminProfileShell";

export default function ProfileAdminSettingsPage() {
  return (
    <AdminProfileShell
      title="Settings"
      subtitle="Configure admin preferences and platform controls."
    >
      <SettingsPage />
    </AdminProfileShell>
  );
}
