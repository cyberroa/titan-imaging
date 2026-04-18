"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-admin";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  role: string | null;
  tags: string[];
  source: string | null;
  notes: string | null;
  consent_marketing: boolean;
  consent_source: string | null;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
};

type TimelineItem = {
  kind: string;
  occurred_at: string;
  label: string;
  data: Record<string, unknown>;
};

type Timeline = {
  customer: Customer;
  items: TimelineItem[];
};

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [consent, setConsent] = useState(false);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetchWithAuth<Timeline>(
        `/api/v1/admin/customers/${id}/timeline`,
        t,
      );
      setData(r);
      setEditNotes(r.customer.notes ?? "");
      setEditTags(r.customer.tags.join(", "));
      setConsent(r.customer.consent_marketing);
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body ?? e.message) : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token);
      else setLoading(false);
    });
  }, [id, load]);

  async function save() {
    if (!token || !id) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetchWithAuth(`/api/v1/admin/customers/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          notes: editNotes || null,
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          consent_marketing: consent,
          consent_source: consent ? "admin" : null,
        }),
      });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="text-sm">
        <Link href="/admin/customers" className="text-accent-titanium hover:underline">
          &larr; All customers
        </Link>
      </p>

      {loading ? (
        <p className="mt-6 text-text-muted">Loading…</p>
      ) : !data ? (
        <p className="mt-6 text-red-200">{error ?? "Not found"}</p>
      ) : (
        <>
          <section className="mt-6">
            <h1 className="text-2xl font-bold md:text-3xl">
              {data.customer.name || data.customer.email}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {data.customer.email}
              {data.customer.company ? ` · ${data.customer.company}` : null}
              {data.customer.role ? ` · ${data.customer.role}` : null}
            </p>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-background-card p-6">
              <h2 className="text-lg font-semibold">Details</h2>
              <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                <dt className="text-text-muted">Phone</dt>
                <dd>{data.customer.phone ?? "—"}</dd>
                <dt className="text-text-muted">Source</dt>
                <dd>{data.customer.source ?? "—"}</dd>
                <dt className="text-text-muted">Added</dt>
                <dd>{new Date(data.customer.created_at).toLocaleString()}</dd>
                <dt className="text-text-muted">Consent</dt>
                <dd>
                  {data.customer.consent_marketing
                    ? `yes (${data.customer.consent_source ?? "unknown"})`
                    : "no"}
                </dd>
              </dl>

              <div className="mt-4 space-y-3 text-sm">
                <label className="block">
                  <span className="text-text-muted">Tags (comma separated)</span>
                  <input
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-text-muted">Notes</span>
                  <textarea
                    className="mt-1 min-h-[100px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span className="text-text-muted">Marketing consent</span>
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-background-card p-6">
              <h2 className="text-lg font-semibold">Timeline</h2>
              {data.items.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">No recorded activity yet.</p>
              ) : (
                <ul className="mt-3 space-y-3 text-sm">
                  {data.items.map((it, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <p className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-accent-titanium">{it.label}</span>
                        <span className="text-xs text-text-muted">
                          {new Date(it.occurred_at).toLocaleString()}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-text-muted">{it.kind}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {error ? (
            <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
