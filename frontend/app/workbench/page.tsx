"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WorkbenchPageHeader } from "@/components/ui";
import { apiFetchWithAuth } from "@/lib/api-workbench";
import { FEATURE_HREF_TO_GUIDE_SLUG } from "@/lib/workbench-guides";
import {
  WORKBENCH_NAV_GROUPS,
  filterNavGroups,
  type StaffAccess,
} from "@/lib/workbench-nav";
import { createClient } from "@/lib/supabase/client";

type MeResponse = {
  staff_tier?: string;
  effective_capabilities?: string[];
  staff?: { staff_tier?: string; effective_capabilities?: string[] };
};

export default function WorkbenchWelcomePage() {
  const [access, setAccess] = useState<StaffAccess | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return;
      void apiFetchWithAuth<MeResponse>("/api/v1/workbench/staff/me", session.access_token)
        .then((me) => {
          setAccess({
            staffTier: me.staff_tier || me.staff?.staff_tier || "staff",
            effectiveCapabilities: me.effective_capabilities || me.staff?.effective_capabilities || [],
          });
        })
        .catch(() => undefined);
    });
  }, []);

  const groups = useMemo(() => filterNavGroups(WORKBENCH_NAV_GROUPS, access), [access]);

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
      <WorkbenchPageHeader
        eyebrow="Welcome"
        title="Titan Workbench"
        align="start"
        description="Your staff hub for AI, CRM, marketing, sales, service, and inventory. Open a tool below, or read its guide when you need how-to detail."
      />

      <section className="rounded-xl border border-accent-admin/30 bg-accent-admin/5 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-admin">Start here</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">Workbench AI Studio</h2>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Draft marketing email, social posts, and outreach with brand presets.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/workbench/studio"
            className="rounded-lg bg-accent-admin px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Open AI Studio
          </Link>
          <Link
            href="/workbench/guides/studio"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            Guide
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">Site map</h2>
        <Link href="/workbench/guides" className="text-sm text-accent-admin hover:underline">
          All guides
        </Link>
      </div>

      {groups.map((group) => (
        <section key={group.id} className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{group.label}</h3>
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {group.links.map((link) => {
              const guideSlug = FEATURE_HREF_TO_GUIDE_SLUG[link.href];
              return (
                <li
                  key={link.href}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{link.label}</p>
                    {link.detail ? (
                      <p className="text-sm text-text-muted">{link.detail}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={link.href}
                      className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-accent-admin hover:text-accent-admin"
                    >
                      Open
                    </Link>
                    {guideSlug ? (
                      <Link
                        href={`/workbench/guides/${guideSlug}`}
                        className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-white/25 hover:text-white"
                      >
                        Guide
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
