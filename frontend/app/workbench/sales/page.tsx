"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WorkbenchPageHeader } from "@/components/ui";
import { WorkbenchSelect } from "@/components/workbench/WorkbenchSelect";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from "@/lib/api-workbench";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { workbenchCard, workbenchTableHead, workbenchTableRow, workbenchTableWrap } from "@/lib/workbench-ui";

type Conversion = {
  id: string;
  customer_email: string | null;
  amount_cents: number;
  closed_at: string;
  status: string;
  source_type: string | null;
  source_id: string | null;
  closer_staff_id: string | null;
  lead_owner_staff_id: string | null;
};

type Customer = { id: string; email: string; name: string | null };
type Staff = { id: string; email: string; display_name: string | null };
type EngagementOpt = {
  id: string;
  summary: string;
  channel: string;
  outcome: string;
  occurred_at: string | null;
  staff_id?: string | null;
};
type CampaignOpt = {
  campaign_id: string;
  campaign_name: string;
  recipient_id: string;
  created_by?: string | null;
};

type SalesSummary = {
  from: string;
  to: string;
  kpis: {
    won_cents: number;
    won_count: number;
    avg_deal_cents: number;
    lost_count: number;
    win_rate: number;
    win_rate_label: string;
    median_days_to_close: number | null;
    open_leads: number;
  };
  weekly: { week_start: string; won_cents: number; won_count: number }[];
  by_source: { source: string; won_cents: number; count: number }[];
  pipeline?: Record<string, number>;
  attribution?: {
    split_credit_cents: number;
    split_credit_pct: number;
    split_count: number;
    by_closer: { staff_id: string | null; name: string; won_cents: number; count: number }[];
    by_lead_owner: { staff_id: string | null; name: string; won_cents: number; count: number }[];
  };
};

const RANGES = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
] as const;

const ELECTRIC = "#2BB4FF";
const FUNNEL = ["new", "contacted", "engaged", "qualified", "proposal", "won"] as const;

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeBounds(id: string) {
  const spec = RANGES.find((r) => r.id === id) ?? RANGES[1];
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (spec.days - 1));
  return { from: isoDate(start), to: isoDate(end) };
}

function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function sourceLabel(source: string) {
  if (source === "engagement") return "Engagement";
  if (source === "campaign") return "Campaign";
  if (source === "unattributed") return "Unattributed";
  return source;
}

type TipEntry = { name?: string; value?: number; color?: string; dataKey?: string };

function ChartTooltip({
  active,
  payload,
  label,
  moneyAxis,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string;
  moneyAxis?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[10rem] rounded-lg border border-accent-admin/25 bg-[#12141a]/95 px-3 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {payload.map((p) => (
          <li key={String(p.dataKey || p.name)} className="flex items-center justify-between gap-4 text-sm">
            <span className="inline-flex items-center gap-2 text-white/75">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color || ELECTRIC }} />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-white">
              {moneyAxis ? money(Number(p.value || 0)) : Number(p.value || 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminSalesPage() {
  return (
    <Suspense fallback={<main className="px-6 py-8 text-sm text-text-muted">Loading…</main>}>
      <AdminSalesPageInner />
    </Suspense>
  );
}

function AdminSalesPageInner() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Conversion[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [closerId, setCloserId] = useState("");
  const [leadOwnerId, setLeadOwnerId] = useState("");
  const [sourceType, setSourceType] = useState<"" | "campaign" | "engagement">("");
  const [sourceId, setSourceId] = useState("");
  const [engagements, setEngagements] = useState<EngagementOpt[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rangeId, setRangeId] = useState<string>("30d");
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const bounds = useMemo(() => rangeBounds(rangeId), [rangeId]);

  const load = useCallback(
    async (t: string) => {
      const qs = `from_date=${bounds.from}&to_date=${bounds.to}`;
      const [c, conv, team, me, dash] = await Promise.all([
        apiFetchWithAuth<{ items: Customer[] }>("/api/v1/workbench/customers?limit=100", t),
        apiFetchWithAuth<Conversion[]>(`/api/v1/workbench/sales/conversions?limit=200&${qs}`, t),
        apiFetchWithAuth<Staff[]>("/api/v1/workbench/staff", t).catch(() => [] as Staff[]),
        apiFetchWithAuth<{ staff_tier?: string }>("/api/v1/workbench/staff/me", t).catch(() => ({ staff_tier: "staff" })),
        apiFetchWithAuth<SalesSummary>(`/api/v1/workbench/sales/summary?${qs}`, t),
      ]);
      setCustomers(c.items);
      setRows(conv);
      setStaff(Array.isArray(team) ? team : []);
      setIsOwner(me.staff_tier === "owner");
      setSummary(dash);
    },
    [bounds.from, bounds.to],
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token).catch(() => undefined);
    });
  }, [load]);

  useEffect(() => {
    const cid = searchParams.get("customer");
    const eng = searchParams.get("engagement");
    const amt = searchParams.get("amount");
    if (cid) setCustomerId(cid);
    if (eng) {
      setSourceType("engagement");
      setSourceId(eng);
    }
    if (amt) setAmount(amt);
  }, [searchParams]);

  useEffect(() => {
    if (!token || !customerId) {
      setEngagements([]);
      setCampaigns([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const [eng, timeline] = await Promise.all([
          apiFetchWithAuth<{ items: EngagementOpt[] }>(
            `/api/v1/workbench/customers/${customerId}/engagements?limit=20`,
            token,
          ),
          apiFetchWithAuth<{
            items: { kind: string; data?: { campaign_id?: string; created_by?: string }; label: string }[];
          }>(`/api/v1/workbench/customers/${customerId}/timeline`, token).catch(() => ({
            items: [],
          })),
        ]);
        if (cancelled) return;
        setEngagements(eng.items || []);
        const camps: CampaignOpt[] = [];
        for (const item of timeline.items || []) {
          if (item.kind.startsWith("campaign:") && item.data?.campaign_id) {
            if (!camps.some((c) => c.campaign_id === item.data!.campaign_id)) {
              camps.push({
                campaign_id: item.data.campaign_id,
                campaign_name: item.label,
                recipient_id: "",
                created_by: item.data.created_by || null,
              });
            }
          }
        }
        setCampaigns(camps);
        const selectedEngId =
          sourceType === "engagement" && sourceId ? sourceId : searchParams.get("engagement");
        const fromEngagement =
          (selectedEngId && (eng.items || []).find((e) => e.id === selectedEngId)?.staff_id) ||
          (eng.items || []).find((e) => e.staff_id)?.staff_id;
        let fromCampaign: string | undefined;
        for (const camp of camps) {
          const email = camp.created_by?.toLowerCase();
          if (!email) continue;
          const match = staff.find((s) => s.email.toLowerCase() === email);
          if (match) {
            fromCampaign = match.id;
            break;
          }
        }
        setLeadOwnerId(fromEngagement || fromCampaign || "");
      } catch {
        if (!cancelled) {
          setEngagements([]);
          setCampaigns([]);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, customerId, staff, sourceType, sourceId, searchParams]);

  async function logSale(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !customerId || !amount) return;
    if (!leadOwnerId) {
      setError(
        "Lead owner is required — the staff who generated the lead still gets conversion credit if an owner or partner closes.",
      );
      return;
    }
    const cents = Math.round(parseFloat(amount) * 100);
    try {
      await apiFetchWithAuth("/api/v1/workbench/sales/conversions", token, {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId,
          amount_cents: cents,
          notes: notes || null,
          status: "won",
          closer_staff_id: closerId || undefined,
          lead_owner_staff_id: leadOwnerId || undefined,
          source_type: sourceType || undefined,
          source_id: sourceId || undefined,
        }),
      });
      setAmount("");
      setNotes("");
      setSourceType("");
      setSourceId("");
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : "Failed");
    }
  }

  const kpis = summary?.kpis;
  const weeklyChart = (summary?.weekly || []).map((w) => ({
    label: w.week_start.slice(5),
    revenue: w.won_cents / 100,
    deals: w.won_count,
  }));
  const sourceChart = (summary?.by_source || []).map((s) => ({
    name: sourceLabel(s.source),
    revenue: s.won_cents / 100,
    deals: s.count,
  }));
  const closerChart = (summary?.attribution?.by_closer || []).map((s) => ({
    name: s.name,
    revenue: s.won_cents / 100,
  }));
  const ownerChart = (summary?.attribution?.by_lead_owner || []).map((s) => ({
    name: s.name,
    revenue: s.won_cents / 100,
  }));

  function staffName(id: string | null) {
    if (!id) return "—";
    const s = staff.find((x) => x.id === id);
    return s?.display_name || s?.email || "—";
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <WorkbenchPageHeader
        eyebrow="Sales"
        title="Sales"
        align="start"
        description="Who closed can be an owner or partner. Lead owner is the staff who found and warmed the account — they still get conversion credit."
        actions={
          <WorkbenchSelect
            value={rangeId}
            onChange={setRangeId}
            options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
          />
        }
      />
      {error && <p className="text-sm text-red-300">{error}</p>}

      {kpis ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Won revenue" value={dollars(kpis.won_cents)} hint={`${bounds.from} → ${bounds.to}`} />
          <Kpi label="Won deals" value={String(kpis.won_count)} />
          <Kpi label="Average deal" value={dollars(kpis.avg_deal_cents)} />
          <Kpi
            label={kpis.win_rate_label === "closed_won_lost" ? "Win rate" : "Won vs open pipeline"}
            value={`${Math.round(kpis.win_rate * 100)}%`}
            hint={
              kpis.win_rate_label === "closed_won_lost"
                ? `${kpis.won_count} won / ${kpis.lost_count} lost in range`
                : `${kpis.open_leads} open leads (no lost conversions in range)`
            }
          />
          <Kpi
            label="Median days to close"
            value={kpis.median_days_to_close == null ? "—" : String(kpis.median_days_to_close)}
            hint="From customer created date to close"
          />
        </div>
      ) : null}

      {isOwner && summary?.attribution ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Attribution</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi
              label="Owner/partner closed marketing lead"
              value={dollars(summary.attribution.split_credit_cents)}
              hint={`${summary.attribution.split_count} deals · ${Math.round(summary.attribution.split_credit_pct * 100)}% of won $`}
            />
            <div className={cn(workbenchCard, "h-72 p-4 sm:col-span-2")}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">Pipeline to cash</p>
              <ResponsiveContainer width="100%" height="78%">
                <BarChart
                  data={FUNNEL.map((st) => ({
                    name: st.charAt(0).toUpperCase() + st.slice(1),
                    accounts: summary.pipeline?.[st] ?? 0,
                  }))}
                  margin={{ left: 0, right: 8, top: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#777" tick={{ fill: "#bbb", fontSize: 11 }} />
                  <YAxis stroke="#777" tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(43,180,255,0.08)" }}
                    content={<ChartTooltip />}
                  />
                  <Bar dataKey="accounts" fill={ELECTRIC} name="Accounts" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-[11px] text-white/40">
                Stage counts are current CRM, not the date range. Won $ above is in-range.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cn(workbenchCard, "h-72 p-4")}>
              <h3 className="mb-3 text-sm font-bold text-white">Won $ by closer</h3>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={closerChart} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" stroke="#777" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={96} stroke="#777" tick={{ fill: "#bbb", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "rgba(43,180,255,0.08)" }} content={<ChartTooltip moneyAxis />} />
                  <Bar dataKey="revenue" fill={ELECTRIC} name="Won $" radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={cn(workbenchCard, "h-72 p-4")}>
              <h3 className="mb-3 text-sm font-bold text-white">Won $ by lead owner</h3>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={ownerChart} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis type="number" stroke="#777" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={96} stroke="#777" tick={{ fill: "#bbb", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "rgba(43,180,255,0.08)" }} content={<ChartTooltip moneyAxis />} />
                  <Bar dataKey="revenue" fill="#0076E6" name="Won $" radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn(workbenchCard, "h-72 p-4")}>
          <h2 className="mb-3 text-sm font-bold text-white">Weekly won revenue</h2>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={weeklyChart} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" stroke="#777" tick={{ fill: "#bbb", fontSize: 11 }} />
              <YAxis stroke="#777" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip cursor={{ stroke: "rgba(43,180,255,0.35)" }} content={<ChartTooltip moneyAxis />} />
              <Line type="monotone" dataKey="revenue" name="Won $" stroke={ELECTRIC} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={cn(workbenchCard, "h-72 p-4")}>
          <h2 className="mb-3 text-sm font-bold text-white">Source mix</h2>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={sourceChart} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#777" tick={{ fill: "#bbb", fontSize: 12 }} />
              <YAxis stroke="#777" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip cursor={{ fill: "rgba(43,180,255,0.08)" }} content={<ChartTooltip moneyAxis />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#bbbbbb" }} iconType="circle" />
              <Bar dataKey="revenue" fill={ELECTRIC} name="Won $" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <form
        onSubmit={(e) => void logSale(e)}
        className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4"
      >
        <h2 className="text-sm font-bold text-white md:col-span-4">Log sale</h2>
        <WorkbenchSelect
          className="md:col-span-2"
          value={customerId}
          onChange={setCustomerId}
          required
          placeholder="Select customer…"
          options={[
            { value: "", label: "Select customer…" },
            ...customers.map((c) => ({
              value: c.id,
              label: `${c.email}${c.name ? ` (${c.name})` : ""}`,
            })),
          ]}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Sale amount ($)"
          className="rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white"
          required
        />
        <button type="submit" className="rounded-lg bg-accent-admin px-4 py-2 text-sm font-semibold text-black">
          Log sale
        </button>

        <WorkbenchSelect
          className="md:col-span-2"
          value={closerId}
          onChange={setCloserId}
          placeholder="Closed by (owner/partner OK; default: you)"
          options={[
            { value: "", label: "Closed by (owner/partner OK; default: you)" },
            ...staff.map((s) => ({
              value: s.id,
              label: s.display_name || s.email,
            })),
          ]}
        />
        <WorkbenchSelect
          className="md:col-span-2"
          value={leadOwnerId}
          onChange={setLeadOwnerId}
          required
          placeholder="Lead owner (required — who generated the lead)"
          options={[
            { value: "", label: "Lead owner (required — who generated the lead)" },
            ...staff.map((s) => ({
              value: s.id,
              label: s.display_name || s.email,
            })),
          ]}
        />

        <WorkbenchSelect
          value={sourceType}
          onChange={(v) => {
            setSourceType(v as "" | "campaign" | "engagement");
            setSourceId("");
          }}
          placeholder="Source type…"
          options={[
            { value: "", label: "Source type…" },
            { value: "engagement", label: "Engagement" },
            { value: "campaign", label: "Campaign" },
          ]}
        />
        <WorkbenchSelect
          className="md:col-span-3"
          value={sourceId}
          onChange={setSourceId}
          disabled={!sourceType}
          placeholder="Select source…"
          options={[
            { value: "", label: "Select source…" },
            ...(sourceType === "engagement"
              ? engagements.map((e) => ({
                  value: e.id,
                  label: `${e.channel}/${e.outcome} — ${e.summary.slice(0, 60)}`,
                }))
              : []),
            ...(sourceType === "campaign"
              ? campaigns.map((c) => ({
                  value: c.campaign_id,
                  label: c.campaign_name,
                }))
              : []),
          ]}
        />

        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white md:col-span-4"
        />
      </form>

      <div className={workbenchTableWrap}>
        <table className="w-full text-left text-sm">
          <thead className={workbenchTableHead}>
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Closed</th>
              <th className="px-4 py-3">Closed by</th>
              <th className="px-4 py-3">Lead owner</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={workbenchTableRow}>
                <td className="px-4 py-3 text-white">{r.customer_email}</td>
                <td className="px-4 py-3">${(r.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-3 text-text-muted">{r.source_type ? `${r.source_type}` : "—"}</td>
                <td className="px-4 py-3">{new Date(r.closed_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-text-muted">{staffName(r.closer_staff_id)}</td>
                <td className="px-4 py-3 text-text-muted">{staffName(r.lead_owner_staff_id)}</td>
                <td className="px-4 py-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={cn(workbenchCard, "p-4")}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-white/40">{hint}</p> : null}
    </div>
  );
}
