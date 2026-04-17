"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-admin";
import { createClient } from "@/lib/supabase/client";

export default function AdminOutreachPage() {
  const [token, setToken] = useState<string | null>(null);
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const emails = recipients
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      setError("Add at least one email.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const out = await apiFetchWithAuth<{ sent: number }>("/api/v1/admin/outreach/send", token, {
        method: "POST",
        body: JSON.stringify({ recipients: emails, subject: subject.trim(), body: body.trim() }),
      });
      setMessage(`Sent to ${out.sent} recipient(s).`);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="text-center">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          Email
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Outreach</h1>
        <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
          Send a one-off message via Resend. Configure <code className="text-accent-titanium">RESEND_API_KEY</code>{" "}
          and customer from-address on the API.
        </p>
      </section>

      <form
        onSubmit={(e) => void send(e)}
        className="mt-10 max-w-2xl rounded-xl border border-white/10 bg-background-card p-6"
      >
        <label className="block text-sm">
          <span className="text-text-muted">Recipients (comma or newline separated)</span>
          <textarea
            className="mt-2 min-h-[100px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="buyer@example.com, ops@example.com"
            required
          />
        </label>
        <label className="mt-6 block text-sm">
          <span className="text-text-muted">Subject</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </label>
        <label className="mt-6 block text-sm">
          <span className="text-text-muted">Message</span>
          <textarea
            className="mt-2 min-h-[200px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={!token || busy}
          className="mt-6 rounded-lg bg-accent-titanium px-6 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </form>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
    </>
  );
}
