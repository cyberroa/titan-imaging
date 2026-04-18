"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-admin";
import { createClient } from "@/lib/supabase/client";

type Segment = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  filter_json: Record<string, unknown>;
};

type Customer = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
};

type Preview = { count: number; sample: Customer[] };

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  filter_json: JSON.stringify(
    { consent_marketing: true, exclude_unsubscribed: true },
    null,
    2,
  ),
};

export default function AdminSegmentsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ segment: Segment; data: Preview } | null>(null);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetchWithAuth<Segment[]>("/api/v1/admin/segments", t);
      setRows(r);
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    let filter: Record<string, unknown>;
    try {
      filter = JSON.parse(form.filter_json || "{}");
    } catch {
      setError("filter_json is not valid JSON");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      filter_json: filter,
    };
    try {
      if (editingId) {
        await apiFetchWithAuth(`/api/v1/admin/segments/${editingId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetchWithAuth("/api/v1/admin/segments", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Save failed");
    }
  }

  async function remove(id: string) {
    if (!token || !confirm("Delete segment?")) return;
    try {
      await apiFetchWithAuth(`/api/v1/admin/segments/${id}`, token, { method: "DELETE" });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Delete failed");
    }
  }

  async function runPreview(seg: Segment) {
    if (!token) return;
    try {
      const p = await apiFetchWithAuth<Preview>(
        `/api/v1/admin/segments/${seg.id}/preview`,
        token,
        { method: "POST" },
      );
      setPreview({ segment: seg, data: p });
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Preview failed",
      );
    }
  }

  function startEdit(s: Segment) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      slug: s.slug,
      description: s.description ?? "",
      filter_json: JSON.stringify(s.filter_json ?? {}, null, 2),
    });
    setPreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="text-center">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          Email
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Segments</h1>
        <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
          Reusable filters over the customer list. A campaign picks one segment and sends to
          everyone it matches.
        </p>
      </section>

      <div className="mt-10 rounded-xl border border-white/10 bg-background-card p-6">
        <h2 className="text-lg font-semibold">
          {editingId ? "Edit segment" : "Create segment"}
        </h2>
        <form onSubmit={(e) => void save(e)} className="mt-4 grid gap-3">
          <label className="block text-sm">
            <span className="text-text-muted">Name *</span>
            <input
              required
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Slug</span>
            <input
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto from name"
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Description</span>
            <input
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Filter JSON</span>
            <textarea
              className="mt-1 min-h-[160px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs"
              value={form.filter_json}
              onChange={(e) => setForm((f) => ({ ...f, filter_json: e.target.value }))}
            />
          </label>
          <p className="text-xs text-text-muted">
            Supported keys: <code>consent_marketing</code>, <code>source</code>,{" "}
            <code>tags_any</code>, <code>tags_all</code>, <code>email_contains</code>,{" "}
            <code>company_contains</code>, <code>exclude_unsubscribed</code>.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black"
            >
              {editingId ? "Save changes" : "Create segment"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="rounded-lg border border-white/15 px-6 py-2 text-sm font-semibold text-text-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setPreview(null);
                }}
              >
                Cancel edit
              </button>
            ) : null}
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
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={4}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={4}>
                  No segments yet.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-accent-titanium">{s.slug}</td>
                  <td className="px-4 py-3 text-text-muted">{s.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 text-accent-titanium hover:underline"
                      onClick={() => void runPreview(s)}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className="mr-3 text-accent-titanium hover:underline"
                      onClick={() => startEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-300 hover:underline"
                      onClick={() => void remove(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {preview ? (
        <div className="mt-10 rounded-xl border border-white/10 bg-background-card p-6">
          <h2 className="text-lg font-semibold">
            {preview.segment.name} — {preview.data.count} matches
          </h2>
          {preview.data.sample.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No matches.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {preview.data.sample.map((c) => (
                <li key={c.id} className="text-text-secondary">
                  {c.email}
                  {c.name ? ` · ${c.name}` : ""}
                  {c.company ? ` · ${c.company}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </>
  );
}
