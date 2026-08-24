"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkbenchPageHeader } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from '@/lib/api-workbench';
import { createClient } from "@/lib/supabase/client";

type Conversion = {
  id: string;
  customer_email: string | null;
  amount_cents: number;
  closed_at: string;
  status: string;
};

type Customer = { id: string; email: string; name: string | null };

export default function AdminSalesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Conversion[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: string) => {
    const [c, conv] = await Promise.all([
      apiFetchWithAuth<{ items: Customer[] }>("/api/v1/workbench/customers?limit=100", t),
      apiFetchWithAuth<Conversion[]>("/api/v1/workbench/sales/conversions", t),
    ]);
    setCustomers(c.items);
    setRows(conv);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token).catch(() => undefined);
    });
  }, [load]);

  async function logSale(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !customerId || !amount) return;
    const cents = Math.round(parseFloat(amount) * 100);
    try {
      await apiFetchWithAuth("/api/v1/workbench/sales/conversions", token, {
        method: "POST",
        body: JSON.stringify({
          customer_id: customerId,
          amount_cents: cents,
          notes: notes || null,
          status: "won",
        }),
      });
      setAmount("");
      setNotes("");
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : "Failed");
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <WorkbenchPageHeader
        eyebrow="Sales"
        title="Sales"
        align="start"
        description="Log lead → sale conversions and track commission earnings."
      />
      {error && <p className="text-sm text-red-300">{error}</p>}

      <form onSubmit={(e) => void logSale(e)} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white md:col-span-2"
          required
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.email} {c.name ? `(${c.name})` : ""}
            </option>
          ))}
        </select>
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
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white md:col-span-4"
        />
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Closed</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 text-white">{r.customer_email}</td>
                <td className="px-4 py-3">${(r.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{new Date(r.closed_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
