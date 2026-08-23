"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  WORKBENCH_NAV_GROUPS,
  filterNavGroups,
  isWorkbenchGroupActive,
  isWorkbenchLinkActive,
  type WorkbenchNavGroup,
  type StaffAccess,
} from '@/lib/workbench-nav';
import { apiFetchWithAuth } from '@/lib/api-workbench';
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("h-3 w-3 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
      aria-hidden
    >
      <path fill="currentColor" d="M2.2 4.2 6 8l3.8-3.8-.9-.9L6 6.2 3.1 3.3z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {open ? (
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

function NavPanel({
  group,
  pathname,
  onNavigate,
}: {
  group: WorkbenchNavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="min-w-[14rem] py-1.5">
      {group.links.map((link) => {
        const active = isWorkbenchLinkActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "block px-3.5 py-2 transition",
                active
                  ? "bg-accent-admin/15 text-accent-admin"
                  : "text-text-secondary hover:bg-white/5 hover:text-white",
              )}
            >
              <span className="block text-sm font-semibold">{link.label}</span>
              {link.detail ? (
                <span className="mt-0.5 block text-xs font-normal text-text-muted">{link.detail}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type MeResponse = {
  workbench_tier?: string;
  staff_tier?: string;
  effective_capabilities?: string[];
  staff?: { workbench_tier?: string; staff_tier?: string; effective_capabilities?: string[] };
  default_landing?: string;
};

export function WorkbenchNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [access, setAccess] = useState<StaffAccess | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);

  const groups = useMemo(() => filterNavGroups(WORKBENCH_NAV_GROUPS, access), [access]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return;
      void apiFetchWithAuth<MeResponse>("/api/v1/workbench/staff/me", session.access_token)
        .then((me) => {
          setAccess({
            staffTier: me.workbench_tier || me.staff_tier || me.staff?.workbench_tier || me.staff?.staff_tier || "staff",
            effectiveCapabilities: me.effective_capabilities || me.staff?.effective_capabilities || [],
          });
        })
        .catch(() => undefined);
    });
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openGroup = (id: string) => {
    clearCloseTimer();
    setOpenId(id);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenId(null), 140);
  };

  useEffect(() => {
    setOpenId(null);
    setMobileOpen(false);
    const activeGroup = groups.find((g) => isWorkbenchGroupActive(pathname, g));
    setMobileExpanded(activeGroup?.id ?? null);
  }, [pathname, groups]);

  useEffect(() => {
    if (!openId && !mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenId(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, mobileOpen]);

  useEffect(() => () => clearCloseTimer(), []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/workbench/login");
    router.refresh();
  }

  function groupTriggerClass(group: WorkbenchNavGroup, open: boolean) {
    const active = isWorkbenchGroupActive(pathname, group) || open;
    return cn(
      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold transition",
      active
        ? "bg-accent-admin/15 text-accent-admin"
        : "text-text-secondary hover:bg-white/5 hover:text-white",
    );
  }

  const homeHref = groups[0]?.links[0]?.href || groups[0]?.href || "/workbench/my-pay";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#16161b]/90 shadow-[inset_0_-1px_0_0_rgba(255,135,0,0.22)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={homeHref}
            className="shrink-0 font-display text-sm font-bold tracking-wider text-accent-admin transition hover:brightness-110"
            onMouseEnter={() => setOpenId(null)}
          >
            Titan Workbench
          </Link>

          <nav
            ref={navRef}
            className="hidden items-center gap-0.5 md:flex"
            aria-label="Workbench"
            onMouseLeave={scheduleClose}
          >
            {groups.map((group) => {
              const open = openId === group.id;
              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => openGroup(group.id)}
                >
                  <button
                    type="button"
                    className={groupTriggerClass(group, open)}
                    aria-expanded={open}
                    aria-controls={`${menuId}-${group.id}`}
                    onClick={() => setOpenId(open ? null : group.id)}
                  >
                    {group.label}
                    <Chevron open={open} />
                  </button>
                  {open ? (
                    <div
                      id={`${menuId}-${group.id}`}
                      role="menu"
                      className="absolute left-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-white/12 bg-[#1a1a22] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                      onMouseEnter={clearCloseTimer}
                    >
                      <NavPanel
                        group={group}
                        pathname={pathname}
                        onNavigate={() => setOpenId(null)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-sm font-semibold text-text-secondary transition hover:border-accent-admin/40 hover:bg-accent-admin/5 hover:text-white sm:inline-flex"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="hidden rounded-lg border border-accent-admin/35 bg-accent-admin/5 px-3 py-1.5 text-sm font-semibold text-accent-admin transition hover:border-accent-admin hover:bg-accent-admin/15 sm:inline-flex"
          >
            Sign out
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-white/15 p-2 text-text-secondary transition hover:bg-white/5 hover:text-white md:hidden"
            aria-expanded={mobileOpen}
            aria-controls={`${menuId}-mobile`}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id={`${menuId}-mobile`}
          className="border-t border-white/10 bg-[#16161b] px-4 py-3 md:hidden"
        >
          <nav className="space-y-1" aria-label="Workbench mobile">
            {groups.map((group) => {
              const expanded = mobileExpanded === group.id;
              return (
                <div key={group.id} className="rounded-lg border border-white/8 bg-white/[0.02]">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold",
                      isWorkbenchGroupActive(pathname, group) ? "text-accent-admin" : "text-white",
                    )}
                    aria-expanded={expanded}
                    onClick={() =>
                      setMobileExpanded((cur) => (cur === group.id ? null : group.id))
                    }
                  >
                    {group.label}
                    <Chevron open={expanded} />
                  </button>
                  {expanded ? (
                    <div className="border-t border-white/8 pb-1">
                      <NavPanel
                        group={group}
                        pathname={pathname}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-sm font-semibold text-text-secondary"
              onClick={() => setMobileOpen(false)}
            >
              View site
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex-1 rounded-lg border border-accent-admin/35 px-3 py-2 text-sm font-semibold text-accent-admin"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
