"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetchWithAuth } from "@/lib/api-workbench";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { WorkbenchAnchoredFlyout } from "@/components/workbench/WorkbenchAnchoredFlyout";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  created_at: string | null;
  unread: boolean;
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"
      />
      <path strokeLinecap="round" d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function WorkbenchNotificationsFlyout() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  const load = useCallback(async (t: string) => {
    const res = await apiFetchWithAuth<{ unread_count: number; items: Notif[] }>(
      "/api/v1/workbench/notifications",
      t,
    );
    setUnread(res.unread_count || 0);
    setItems(res.items || []);
  }, []);

  useEffect(() => {
    if (!token) return;
    void load(token).catch(() => undefined);
    const id = window.setInterval(() => {
      void load(token).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [token, load]);

  useEffect(() => {
    if (open && token) void load(token).catch(() => undefined);
  }, [open, token, load]);

  async function markRead(id: string) {
    if (!token) return;
    try {
      await apiFetchWithAuth(`/api/v1/workbench/notifications/${id}/read`, token, { method: "POST" });
      await load(token);
    } catch {
      /* ignore */
    }
  }

  async function markAll() {
    if (!token) return;
    setBusy(true);
    try {
      await apiFetchWithAuth("/api/v1/workbench/notifications/read-all", token, { method: "POST" });
      await load(token);
    } finally {
      setBusy(false);
    }
  }

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title="Notifications"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition",
          open
            ? "border-accent-admin/50 bg-accent-admin/15 text-accent-admin"
            : "border-white/15 bg-white/[0.03] text-white/80 hover:border-accent-admin/40 hover:text-white",
        )}
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-accent-admin px-1 text-center text-[10px] font-bold leading-4 text-black">
            {badge}
          </span>
        ) : null}
      </button>
      <WorkbenchAnchoredFlyout
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={btnRef}
        align="right"
        width={360}
        label="Notifications"
      >
        <div className="border-b border-white/10 bg-[#0a0a0a] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void markAll()}
                className="text-xs font-medium text-accent-admin hover:underline disabled:opacity-40"
              >
                Mark all read
              </button>
            ) : null}
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto bg-[#0a0a0a] p-2">
          {items.length === 0 ? (
            <p className="rounded-lg bg-[#161616] px-3 py-4 text-center text-xs text-white/55">
              No new alerts
            </p>
          ) : (
            <ul className="space-y-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href || "/workbench/analytics"}
                    onClick={() => {
                      void markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "block rounded-lg px-3 py-2 transition hover:bg-white/5",
                      n.unread ? "bg-[#161616]" : "opacity-70",
                    )}
                  >
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    {n.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{n.body}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-white/35">
                      {n.kind.replace(/_/g, " ")} · {relativeTime(n.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </WorkbenchAnchoredFlyout>
    </>
  );
}
