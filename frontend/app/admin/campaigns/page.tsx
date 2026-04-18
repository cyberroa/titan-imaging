"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-admin";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
  template_id: string;
  segment_id: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  stats_json: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

type Template = { id: string; name: string; slug: string; subject: string };
type Segment = { id: string; name: string; slug: string };

const emptyForm = { name: "", template_id: "", segment_id: "" };

export default function AdminCampaignsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const [c, tpls, segs] = await Promise.all([
        apiFetchWithAuth<Campaign[]>("/api/v1/admin/campaigns", t),
        apiFetchWithAuth<Template[]>("/api/v1/admin/templates", t),
        apiFetchWithAuth<Segment[]>("/api/v1/admin/segments", t),
      ]);
      setRows(c);
      setTemplates(tpls);
      setSegments(segs);
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body ?? e.message) : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token);
      else setLoading(false);
    });
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!form.template_id) {
      setError("Please pick a template");
      return;
    }
    setError(null);
    try {
      await apiFetchWithAuth("/api/v1/admin/campaigns", token, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          template_id: form.template_id,
          segment_id: form.segment_id || null,
        }),
      });
      setForm(emptyForm);
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Create failed");
    }
  }

  async function send(id: string) {
    if (!token) return;
    if (!confirm("Send this campaign now? This cannot be undone.")) return;
    setSendingId(id);
    setError(null);
    try {
      const r = await apiFetchWithAuth<{ queued: number; skipped_suppressed: number }>(
        `/api/v1/admin/campaigns/${id}/send`,
        token,
        { method: "POST" },
      );
      alert(`Queued ${r.queued}, skipped (suppressed) ${r.skipped_suppressed}.`);
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Send failed");
    } finally {
      setSendingId(null);
    }
  }

  async function remove(id: string) {
    if (!token || !confirm("Delete campaign?")) return;
    try {
      await apiFetchWithAuth(`/api/v1/admin/campaigns/${id}`, token, { method: "DELETE" });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Delete failed");
    }
  }

  return (
    <>
      <section className="text-center">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          Email
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Campaigns</h1>
        <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
          Pick a template, pick a segment, send. Suppressed contacts are automatically skipped.
        </p>
      </section>

      <div className="mt-10 rounded-xl border border-white/10 bg-background-card p-6">
        <h2 className="text-lg font-semibold">New campaign</h2>
        <form onSubmit={(e) => void create(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-text-muted">Name *</span>
            <input
              required
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Template *</span>
            <select
              required
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.template_id}
              onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
            >
              <option value="">Choose…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Segment (optional — all customers if blank)</span>
            <select
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.segment_id}
              onChange={(e) => setForm((f) => ({ ...f, segment_id: e.target.value }))}
            >
              <option value="">All customers</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black"
            >
              Create campaign
            </button>
          </div>
        </form>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-background-raised text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Stats</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={5}>
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const s = (c.stats_json || {}) as Record<string, unknown>;
                const sent = typeof s.sent === "number" ? s.sent : 0;
                const queued = typeof s.queued === "number" ? s.queued : 0;
                const failed = typeof s.failed === "number" ? s.failed : 0;
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/campaigns/${c.id}`}
                        className="text-accent-titanium hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{c.status}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      queued {queued} · sent {sent} · failed {failed}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "draft" || c.status === "scheduled" ? (
                        <button
                          type="button"
                          disabled={sendingId === c.id}
                          className="mr-3 text-accent-titanium hover:underline disabled:opacity-50"
                          onClick={() => void send(c.id)}
                        >
                          {sendingId === c.id ? "Sending…" : "Send now"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-red-300 hover:underline"
                        onClick={() => void remove(c.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
