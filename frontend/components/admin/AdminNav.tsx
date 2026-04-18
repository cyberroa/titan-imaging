"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
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
    <header className="border-b border-white/10 bg-background-raised">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin/parts" className="font-display text-sm font-bold tracking-wider text-accent-titanium">
            Admin
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    active ? "text-accent-titanium" : "text-text-secondary hover:text-white"
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-text-muted hover:text-white">
            View site
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold text-text-secondary hover:border-accent-titanium hover:text-accent-titanium"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
