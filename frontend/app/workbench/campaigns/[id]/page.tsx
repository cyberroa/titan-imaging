"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CampaignProgressBar } from "@/components/workbench/CampaignProgressBar";
import { EmailHtmlPreview } from "@/components/workbench/EmailHtmlPreview";
import { WorkbenchSelect } from "@/components/workbench/WorkbenchSelect";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from '@/lib/api-workbench';
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
  template_id: string;
  segment_id: string | null;
  mail_domain_id: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  previewed_at: string | null;
  stats_json: Record<string, unknown>;
  progress: {
    total: number;
    sent: number;
    remaining: number;
    failed: number;
    days: number;
    day_index: number;
    percent: number;
  };
  created_at: string;
};

type MailDomain = { id: string; hostname: string; from_email: string; daily_cap: number; active: boolean };

type Recipient = {
  id: string;
  email: string;
  status: string;
  resend_message_id: string | null;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  unsubscribed_at: string | null;
};

type Preview = { subject: string; html: string; text: string };

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [token, setToken] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [domains, setDomains] = useState<MailDomain[]>([]);
  const [domainId, setDomainId] = useState("");
  const [maxPerDay, setMaxPerDay] = useState("80");
  const [maxDays, setMaxDays] = useState("14");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const [c, r, d] = await Promise.all([
        apiFetchWithAuth<Campaign>(`/api/v1/workbench/campaigns/${id}`, t),
        apiFetchWithAuth<Recipient[]>(`/api/v1/workbench/campaigns/${id}/recipients`, t),
        apiFetchWithAuth<MailDomain[]>("/api/v1/workbench/mail-domains", t),
      ]);
      setCampaign(c);
      setRecipients(r);
      setDomains(d.filter((x) => x.active));
      const preferred = c.mail_domain_id || d.find((x) => x.active)?.id || d[0]?.id;
      setDomainId((current) => current || preferred || "");
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

  async function runPreview() {
    if (!token || !id) return;
    try {
      const p = await apiFetchWithAuth<Preview>(
        `/api/v1/workbench/campaigns/${id}/preview`,
        token,
        { method: "POST", body: JSON.stringify({ sample: {} }) },
      );
      setPreview(p);
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Preview failed");
    }
  }

  async function arm() {
    if (!token || !id) return;
    try {
      await apiFetchWithAuth(`/api/v1/workbench/campaigns/${id}/arm`, token, {
        method: "POST",
        body: JSON.stringify({
          mail_domain_id: domainId,
          max_per_day: Number(maxPerDay) || 80,
          max_days: Number(maxDays) || 14,
        }),
      });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Arm failed");
    }
  }

  async function pause() {
    if (!token || !id) return;
    try {
      await apiFetchWithAuth(`/api/v1/workbench/campaigns/${id}/pause`, token, { method: "POST" });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Pause failed");
    }
  }

  const summary = campaign?.stats_json as Record<string, unknown> | undefined;

  return (
    <>
      <p className="text-sm">
        <Link href="/workbench/campaigns" className="text-accent-admin hover:underline">
          &larr; All campaigns
        </Link>
      </p>

      {loading ? (
        <p className="mt-6 text-text-muted">Loading…</p>
      ) : !campaign ? (
        <p className="mt-6 text-red-200">{error ?? "Not found"}</p>
      ) : (
        <>
          {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}

          <section className="mt-6">
            <h1 className="text-2xl font-bold md:text-3xl">{campaign.name}</h1>
            <p className="mt-1 text-sm text-text-muted">
              Status: {campaign.status}
              {campaign.sent_at
                ? ` · Sent ${new Date(campaign.sent_at).toLocaleString()}`
                : null}
            </p>
            {summary ? (
              <p className="mt-2 text-xs text-text-muted">
                Audience: {String(summary.audience_total ?? "—")} · Queued:{" "}
                {String(summary.queued ?? "—")} · Sent: {String(summary.sent ?? "—")} · Failed:{" "}
                {String(summary.failed ?? "—")} · Skipped (suppressed):{" "}
                {String(summary.skipped_suppressed ?? "—")}
              </p>
            ) : null}
            <div className="mt-4 max-w-xl">
              <CampaignProgressBar progress={campaign.progress} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-text-secondary hover:border-accent-admin hover:text-accent-admin"
                onClick={() => void runPreview()}
              >
                Preview HTML
              </button>
              {campaign.status === "armed" || campaign.status === "running" ? (
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm"
                  onClick={() => void pause()}
                >
                  Pause
                </button>
              ) : null}
            </div>
            {campaign.status === "draft" || campaign.status === "scheduled" || campaign.status === "paused" ? (
              <div className="mt-6 grid max-w-xl gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-text-muted">Mail domain</span>
                  <WorkbenchSelect
                    className="mt-1"
                    value={domainId}
                    onChange={setDomainId}
                    options={domains.map((d) => ({
                      value: d.id,
                      label: `${d.hostname} (${d.from_email})`,
                    }))}
                    placeholder="Add a mail domain first"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-text-muted">Max per day</span>
                  <input
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                    value={maxPerDay}
                    onChange={(e) => setMaxPerDay(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-text-muted">Max days</span>
                  <input
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
                    value={maxDays}
                    onChange={(e) => setMaxDays(e.target.value)}
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled={!campaign.previewed_at || !domainId}
                    className="rounded-lg bg-accent-admin px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                    onClick={() => void arm()}
                  >
                    Arm sequenced send
                  </button>
                  <p className="mt-2 text-xs text-white/45">
                    Preview HTML first. Cron `POST /api/v1/workbench/ai/jobs/campaigns-tick` sends the daily quota from the mail domain, not the site apex.
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          {preview ? (
            <div className="mt-6">
              <EmailHtmlPreview subject={preview.subject} html={preview.html} text={preview.text} />
            </div>
          ) : null}

          <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-background-raised text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Sent</th>
                  <th className="px-4 py-3 font-semibold">Opened</th>
                  <th className="px-4 py-3 font-semibold">Clicked</th>
                  <th className="px-4 py-3 font-semibold">Bounced</th>
                  <th className="px-4 py-3 font-semibold">Unsub</th>
                </tr>
              </thead>
              <tbody>
                {recipients.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-text-muted" colSpan={7}>
                      No recipients yet.
                    </td>
                  </tr>
                ) : (
                  recipients.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">{r.email}</td>
                      <td className="px-4 py-3 text-text-muted">{r.status}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {r.opened_at ? "✓" : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {r.clicked_at ? "✓" : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {r.bounced_at ? "✓" : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {r.unsubscribed_at ? "✓" : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
