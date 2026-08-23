"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin/live", label: "Live" },
  { href: "/admin/parts", label: "Parts" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/segments", label: "Segments" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/social", label: "Social" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/outreach", label: "Outreach" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#16161b]/85 shadow-[inset_0_-1px_0_0_rgba(255,135,0,0.22)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/parts"
            className="font-display text-sm font-bold tracking-wider text-accent-admin transition hover:brightness-110"
          >
            Titan Admin
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm font-semibold">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 transition",
                    active
                      ? "bg-accent-admin/15 text-accent-admin"
                      : "text-text-secondary hover:bg-white/5 hover:text-white",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:border-accent-admin/40 hover:bg-accent-admin/5 hover:text-white"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-accent-admin/35 bg-accent-admin/5 px-3 py-1.5 text-sm font-semibold text-accent-admin transition hover:border-accent-admin hover:bg-accent-admin/15"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
