"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminSupabaseSetup } from "@/components/admin/AdminSupabaseSetup";
import { isSupabaseConfigured } from "@/lib/env-public";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const supabaseOk = isSupabaseConfigured();

  if (!supabaseOk && !isLogin) {
    return (
      <div className="min-h-screen bg-background text-white">
        <AdminSupabaseSetup />
      </div>
    );
  }

  if (isLogin) {
    return <div className="min-h-screen bg-background text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
