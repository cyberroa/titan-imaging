"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-admin";
import { createClient } from "@/lib/supabase/client";

type LiveSession = {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  score: number;
  current_url: string | null;
  latest_search: string | null;
  parts_viewed: string[];
  customer: {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
  } | null;
};

type HotLead = {
  customer_id: string;
  email: string;
  name: string | null;
  company: string | null;
  score: number;
  last_seen_at: string | null;
};

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60_000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? "1 hr ago" : `${hours} hr ago`;
}

export default function AdminLivePage() {
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async (t: string, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [live, leads] = await Promise.all([
        apiFetchWithAuth<LiveSession[]>("/api/v1/admin/sessions/live?minutes=15", t),
        apiFetchWithAuth<HotLead[]>("/api/v1/admin/sessions/hot-leads?hours=24", t),
      ]);
      setSessions(live);
      setHotLeads(leads);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body ?? e.message) : "Failed to load");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token, true);
      else setLoading(false);
    });
  }, [load]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      void load(token);
    }, 10_000);
    return () => window.clearInterval(id);
  }, [token, load]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Analytics"
        title="Live visitors"
        description="Active browsing sessions in the last 15 minutes, with engagement scores and hot leads from the last 24 hours. Refreshes every 10 seconds."
        actions={
          lastRefresh ? (
            <p className="text-xs text-text-muted">Updated {formatRelative(lastRefresh.toISOString())}</p>
          ) : null
        }
        align="start"
      />

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Hot leads (24h)</h2>
        <p className="mt-1 text-sm text-text-muted">
          Identified customers above the engagement score threshold.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-background-raised text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {loading && hotLeads.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : hotLeads.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={4}>
                    No hot leads in the last 24 hours.
                  </td>
                </tr>
              ) : (
                hotLeads.map((lead) => (
                  <tr key={lead.customer_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-accent-admin">{lead.score.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${lead.customer_id}`}
                        className="font-semibold text-white hover:text-accent-admin"
                      >
                        {lead.name ?? lead.email}
                      </Link>
                      {lead.name ? (
                        <p className="text-xs text-text-muted">{lead.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{lead.company ?? "—"}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {lead.last_seen_at ? formatTime(lead.last_seen_at) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Active sessions</h2>
        <p className="mt-1 text-sm text-text-muted">Visitors with activity in the last 15 minutes.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-background-raised text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Visitor</th>
                <th className="px-4 py-3 font-semibold">Search</th>
                <th className="px-4 py-3 font-semibold">Parts viewed</th>
                <th className="px-4 py-3 font-semibold">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {loading && sessions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-text-muted" colSpan={5}>
                    No active visitors right now.
                  </td>
                </tr>
              ) : (
                sessions.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-accent-admin">{row.score.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      {row.customer ? (
                        <>
                          <Link
                            href={`/admin/customers/${row.customer.id}`}
                            className="font-semibold text-white hover:text-accent-admin"
                          >
                            {row.customer.name ?? row.customer.email}
                          </Link>
                          {row.customer.company ? (
                            <p className="text-xs text-text-muted">{row.customer.company}</p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-text-muted">Anonymous</span>
                      )}
                      {row.current_url ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-text-muted" title={row.current_url}>
                          {row.current_url}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{row.latest_search ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.parts_viewed.length > 0 ? (
                        <span className="font-mono text-xs text-accent-admin">
                          {row.parts_viewed.join(", ")}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatRelative(row.last_seen_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
