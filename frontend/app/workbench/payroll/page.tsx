"use client";

import { useCallback, useEffect, useState } from "react";
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
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from '@/lib/api-workbench';
import { createClient } from "@/lib/supabase/client";

type StaffSummary = {
  staff_id: string;
  display_name: string;
  email: string;
  commission_cents: number;
  hourly_cents: number;
  adhoc_cents: number;
  service_cents: number;
  total_cents: number;
  owed_cents: number;
  paid_cents: number;
  hours_logged: number;
  sales_closed: number;
  support_logs: number;
  service_jobs: number;
};

type PayrollSummary = {
  from: string;
  to: string;
  staff: StaffSummary[];
  weekly_trend: { week_start: string; total_cents: number }[];
};

type StaffRow = { id: string; display_name: string | null; email: string; active: boolean };

type LedgerRow = {
  id: string;
  staff_id: string;
  staff_name: string;
  source_type: string;
  amount_cents: number;
  earned_at: string;
  status: string;
  note: string | null;
};

function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function AdminPayrollPage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<PayrollSummary | null>(null);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [adhocRows, setAdhocRows] = useState<LedgerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async (t: string) => {
    try {
      const [r, staff, ledger] = await Promise.all([
        apiFetchWithAuth<PayrollSummary>("/api/v1/workbench/payroll/summary", t),
        apiFetchWithAuth<StaffRow[]>("/api/v1/workbench/staff", t),
        apiFetchWithAuth<LedgerRow[]>("/api/v1/workbench/payroll/ledger?source_type=adhoc&limit=40", t),
      ]);
      setData(r);
      const active = staff.filter((s) => s.active);
      setStaffList(active);
      setAdhocRows(ledger);
      setStaffId((prev) => prev || active[0]?.id || "");
    } catch (e) {
      setError(e instanceof ApiError ? JSON.stringify(e.body ?? e.message) : "Payroll load failed (owner or accounting)");
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token);
    });
  }, [load]);

  async function submitAdhoc(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !staffId || !description.trim()) return;
    const dollarsNum = Number(amountDollars);
    if (!Number.isFinite(dollarsNum) || dollarsNum === 0) {
      setError("Enter a non-zero amount");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetchWithAuth("/api/v1/workbench/payroll/adhoc", token, {
        method: "POST",
        body: JSON.stringify({
          staff_id: staffId,
          amount_cents: Math.round(dollarsNum * 100),
          description: description.trim(),
        }),
      });
      setAmountDollars("");
      setDescription("");
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Adhoc failed");
    } finally {
      setBusy(false);
    }
  }

  async function voidAdhoc(id: string) {
    if (!token) return;
    setBusy(true);
    try {
      await apiFetchWithAuth(`/api/v1/workbench/payroll/ledger/${id}/void`, token, { method: "POST" });
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body ?? err.message) : "Void failed");
    } finally {
      setBusy(false);
    }
  }

  const owedChart =
    data?.staff.map((s) => ({
      name: s.display_name.split(" ")[0] || s.email.split("@")[0],
      owed: s.owed_cents / 100,
      commission: s.commission_cents / 100,
      hourly: s.hourly_cents / 100,
      adhoc: (s.adhoc_cents ?? 0) / 100,
      service: (s.service_cents ?? 0) / 100,
    })) ?? [];

  const trendChart =
    data?.weekly_trend.map((w) => ({
      week: w.week_start.slice(5),
      total: w.total_cents / 100,
    })) ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <WorkbenchPageHeader
        eyebrow="Payroll"
        title="Payroll"
        align="start"
        description="How much to pay each admin — commission, hourly, service, adhoc (bonus / events / reimbursements)."
      />
      {error && <p className="text-sm text-red-300">{error}</p>}

      <form
        onSubmit={submitAdhoc}
        className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 className="sm:col-span-2 lg:col-span-4 text-sm font-bold text-white">Add adhoc pay</h2>
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
          required
        >
          <option value="">Staff…</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id} className="bg-black">
              {s.display_name || s.email}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          value={amountDollars}
          onChange={(e) => setAmountDollars(e.target.value)}
          placeholder="Amount ($)"
          className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
          required
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (bonus, event, expense…)"
          className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white sm:col-span-2 lg:col-span-1"
          required
        />
        <button
          type="submit"
          disabled={busy || !token}
          className="rounded-lg bg-accent-admin px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 lg:col-span-1"
        >
          {busy ? "Saving…" : "Record"}
        </button>
      </form>

      {data && (
        <>
          <p className="text-sm text-text-secondary">
            Period {data.from} → {data.to}
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="mb-2 text-sm font-bold text-white">Owed by admin ($)</h2>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={owedChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis type="category" dataKey="name" width={80} stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="owed" fill="#ff8700" name="Owed" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="mb-2 text-sm font-bold text-white">Commission / hourly / service / adhoc ($)</h2>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={owedChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="commission" stackId="a" fill="#6366f1" name="Commission" />
                  <Bar dataKey="hourly" stackId="a" fill="#22c55e" name="Hourly" />
                  <Bar dataKey="service" stackId="a" fill="#38bdf8" name="Service" />
                  <Bar dataKey="adhoc" stackId="a" fill="#ff8700" name="Adhoc" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72 rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
              <h2 className="mb-2 text-sm font-bold text-white">Weekly payout liability ($)</h2>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="week" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#ff8700" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-text-muted">
                <tr>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Hourly</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Adhoc</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Owed</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Service jobs</th>
                  <th className="px-4 py-3">Support</th>
                </tr>
              </thead>
              <tbody>
                {data.staff.map((s) => (
                  <tr key={s.staff_id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-semibold text-white">{s.display_name}</td>
                    <td className="px-4 py-3">{dollars(s.commission_cents)}</td>
                    <td className="px-4 py-3">{dollars(s.hourly_cents)}</td>
                    <td className="px-4 py-3">{dollars(s.service_cents ?? 0)}</td>
                    <td className="px-4 py-3">{dollars(s.adhoc_cents ?? 0)}</td>
                    <td className="px-4 py-3">{dollars(s.total_cents)}</td>
                    <td className="px-4 py-3 text-accent-admin">{dollars(s.owed_cents)}</td>
                    <td className="px-4 py-3">{s.sales_closed}</td>
                    <td className="px-4 py-3">{s.hours_logged.toFixed(1)}</td>
                    <td className="px-4 py-3">{s.service_jobs ?? 0}</td>
                    <td className="px-4 py-3">{s.support_logs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <h2 className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white">
              Recent adhoc
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-text-muted">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {adhocRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-text-muted" colSpan={6}>
                      No adhoc entries this period.
                    </td>
                  </tr>
                ) : (
                  adhocRows.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(r.earned_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{r.staff_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{r.note || "—"}</td>
                      <td className="px-4 py-3">{dollars(r.amount_cents)}</td>
                      <td className="px-4 py-3">{r.status}</td>
                      <td className="px-4 py-3">
                        {r.status === "owed" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void voidAdhoc(r.id)}
                            className="text-xs text-red-300 hover:underline disabled:opacity-50"
                          >
                            Void
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
