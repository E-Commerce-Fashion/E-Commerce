"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { useUserStore } from "@/store/userStore";

interface AdminProfileShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AdminProfileShell({ title, subtitle, children }: AdminProfileShellProps) {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useUserStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "admin") {
      router.replace("/profile");
    }
  }, [hasHydrated, isAuthenticated, user?.role, router]);

  if (!hasHydrated || !isAuthenticated || user?.role !== "admin") {
    return (
      <AccountShell title={title} subtitle={subtitle}>
        <div className="h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell title={title} subtitle={subtitle}>
      {children}
    </AccountShell>
  );
}
