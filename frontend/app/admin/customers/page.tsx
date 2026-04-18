"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth, apiUploadWithAuth } from "@/lib/api-admin";
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
  created_at: string;
};

type ImportResult = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

const emptyForm = {
  email: "",
  name: "",
  company: "",
  phone: "",
  role: "",
  tags: "",
  source: "",
  notes: "",
  consent_marketing: false,
};

export default function AdminCustomersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const load = useCallback(
    async (t: string, q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const path = q
          ? `/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=200`
          : "/api/v1/admin/customers?limit=200";
        const r = await apiFetchWithAuth<Customer[]>(path, t);
        setRows(r);
      } catch (e) {
        setError(
          e instanceof ApiError ? JSON.stringify(e.body ?? e.message) : "Failed to load",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token);
      else setLoading(false);
    });
  }, [load]);

  async function saveCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    const payload = {
      email: form.email.trim(),
      name: form.name.trim() || null,
      company: form.company.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source: form.source.trim() || null,
      notes: form.notes.trim() || null,
      consent_marketing: form.consent_marketing,
      consent_source: form.consent_marketing ? "admin" : null,
    };
    try {
      await apiFetchWithAuth<Customer>("/api/v1/admin/customers", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setForm(emptyForm);
      await load(token, search);
    } catch (err) {
      setError(
        err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Save failed",
      );
    }
  }

  async function removeCustomer(id: string) {
    if (!token || !confirm("Delete this customer? Their campaign history is kept.")) return;
    try {
      await apiFetchWithAuth(`/api/v1/admin/customers/${id}`, token, { method: "DELETE" });
      await load(token, search);
    } catch (err) {
      setError(
        err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Delete failed",
      );
    }
  }

  async function runImport(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !file) return;
    setError(null);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUploadWithAuth<ImportResult>(
        "/api/v1/admin/customers/import",
        token,
        fd,
        { dry_run: dryRun },
      );
      setImportResult(res);
      if (!dryRun) await load(token, search);
    } catch (err) {
      setError(
        err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Import failed",
      );
    }
  }

  return (
    <>
      <section className="text-center">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          CRM
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Customers</h1>
        <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
          Ingest contacts from Titan Imaging&rsquo;s spreadsheets, manage tags and consent, and
          view a per-customer timeline of email and site activity.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-background-card p-6">
          <h2 className="text-lg font-semibold">Add customer</h2>
          <form onSubmit={(e) => void saveCustomer(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-muted">Email *</span>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">Name</span>
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">Company</span>
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">Phone</span>
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">Role</span>
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-muted">Source</span>
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="manual, referral, import"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-muted">Tags (comma separated)</span>
              <input
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="hospital, repeat, warm"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-text-muted">Notes</span>
              <textarea
                className="mt-1 min-h-[70px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.consent_marketing}
                onChange={(e) =>
                  setForm((f) => ({ ...f, consent_marketing: e.target.checked }))
                }
              />
              <span className="text-text-muted">Marketing consent on file</span>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black"
              >
                Add customer
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-background-card p-6">
          <h2 className="text-lg font-semibold">Bulk import (.csv / .xlsx)</h2>
          <p className="mt-2 text-sm text-text-muted">
            Columns: email, name, company, phone, role, tags, source, notes, consent_marketing.
            Upsert by email.
          </p>
          <form onSubmit={(e) => void runImport(e)} className="mt-4 space-y-3 text-sm">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-text-secondary"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
              />
              <span className="text-text-muted">Dry run (preview counts only)</span>
            </label>
            <button
              type="submit"
              disabled={!file}
              className="rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              Upload
            </button>
          </form>
          {importResult ? (
            <div className="mt-4 rounded-md border border-white/10 bg-black/30 p-3 text-sm">
              <p className="text-text-secondary">
                Created: {importResult.created} &middot; Updated: {importResult.updated} &middot;
                Errors: {importResult.errors.length}
              </p>
              {importResult.errors.length ? (
                <ul className="mt-2 list-disc pl-5 text-red-200">
                  {importResult.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <input
          className="w-full max-w-sm rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm"
          placeholder="Search email / name / company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-text-secondary hover:border-accent-titanium hover:text-accent-titanium"
          onClick={() => token && void load(token, search)}
        >
          Search
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-background-raised text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <th className="px-4 py-3 font-semibold">Consent</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-text-muted" colSpan={6}>
                  No customers yet.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="text-accent-titanium hover:underline"
                    >
                      {c.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.name ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{c.company ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {c.tags.length ? c.tags.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {c.consent_marketing ? "yes" : "no"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-red-300 hover:underline"
                      onClick={() => void removeCustomer(c.id)}
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
