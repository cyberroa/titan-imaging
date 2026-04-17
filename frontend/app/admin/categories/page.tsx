"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, type ApiCategory } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-admin";
import { createClient } from "@/lib/supabase/client";

export default function AdminCategoriesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const c = await apiFetchWithAuth<ApiCategory[]>("/api/v1/admin/categories", t);
      setRows(c);
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

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await apiFetchWithAuth<ApiCategory>("/api/v1/admin/categories", token, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || null }),
      });
      setName("");
      setSlug("");
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Create failed");
    }
  }

  async function removeCategory(id: string) {
    if (!token || !confirm("Delete this category? Parts must be reassigned first.")) return;
    try {
      await apiFetchWithAuth<{ ok: boolean }>(`/api/v1/admin/categories/${id}`, token, {
        method: "DELETE",
      });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Delete failed");
    }
  }

  return (
    <>
      <section className="text-center">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          Taxonomy
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Categories</h1>
        <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
          Slugs are used by the inventory API and import template (e.g. <code className="text-accent-titanium">ct</code>
          , <code className="text-accent-titanium">pet</code>).
        </p>
      </section>

      <form
        onSubmit={(e) => void createCategory(e)}
        className="mt-10 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-background-card p-6"
      >
        <label className="block text-sm">
          <span className="text-text-muted">Name *</span>
          <input
            className="mt-1 w-56 rounded-md border border-white/10 bg-black/40 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-text-muted">Slug (optional)</span>
          <input
            className="mt-1 w-56 rounded-md border border-white/10 bg-black/40 px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto from name"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black"
        >
          Add category
        </button>
      </form>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-10 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-background-raised text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-accent-titanium">{c.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-red-300 hover:underline"
                      onClick={() => void removeCategory(c.id)}
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
    </>
  );
}
