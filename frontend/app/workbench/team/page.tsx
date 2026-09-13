"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkbenchPageHeader } from "@/components/ui";
import { WorkbenchSelect } from "@/components/workbench/WorkbenchSelect";
import { ApiError } from "@/lib/api";
import { apiFetchWithAuth } from '@/lib/api-workbench';
import { createClient } from "@/lib/supabase/client";

type Staff = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  staff_tier: string;
  staff_tier_label: string;
  capabilities: string[];
  effective_capabilities: string[];
  pay_commission_applies_to?: string;
  pay_policy_name?: string;
  active: boolean;
};

type Policy = {
  id: string;
  name: string;
  version: number;
  active?: boolean;
  is_default?: boolean;
  commission_applies_to?: string;
  commission_rate_bps?: number;
  hourly_rate_cents?: number;
  currency?: string;
  terms_markdown?: string;
};

const APPLIES_OPTIONS = [
  { value: "lead_owner", label: "Lead owner (who generated the lead)" },
  { value: "closer", label: "Closer (who closed the sale)" },
  { value: "both_split", label: "Split between lead owner and closer" },
];

function emptyPolicyForm() {
  return {
    name: "",
    commissionPct: "5",
    applies: "lead_owner",
    hourly: "25",
    terms:
      "Commission applies to won sales where you are the lead owner (you generated the lead). An owner or partner may close the deal. Hourly rate applies to submitted time entries after acceptance.",
    isDefault: true,
  };
}

type RoleOption = { id: string; label: string };

const TIER_OPTIONS: RoleOption[] = [
  { id: "owner", label: "Owner" },
  { id: "admin", label: "Ops lead" },
  { id: "staff", label: "Staff" },
];

const CAP_OPTIONS: RoleOption[] = [
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales" },
  { id: "support", label: "Support" },
  { id: "accounting", label: "Accounting" },
  { id: "technician", label: "Technician" },
];

export default function AdminTeamPage() {
  const [token, setToken] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("staff");
  const [caps, setCaps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState("staff");
  const [editCaps, setEditCaps] = useState<string[]>([]);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState(() => emptyPolicyForm());
  const [assignPick, setAssignPick] = useState<Record<string, string>>({});

  const load = useCallback(async (t: string) => {
    const [s, p] = await Promise.all([
      apiFetchWithAuth<Staff[]>("/api/v1/workbench/staff", t),
      apiFetchWithAuth<Policy[]>("/api/v1/workbench/pay-policies", t),
    ]);
    setStaff(s);
    setPolicies(p);
    const def = p.find((x) => x.is_default)?.id || p[0]?.id || "";
    if (def) {
      setAssignPick((prev) => {
        const next = { ...prev };
        for (const row of s) {
          if (!next[row.id]) next[row.id] = def;
        }
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token).catch(() => undefined);
    });
  }, [load]);

  function toggleCap(list: string[], id: string, set: (v: string[]) => void) {
    set(list.includes(id) ? list.filter((c) => c !== id) : [...list, id]);
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !email.trim()) return;
    setError(null);
    try {
      await apiFetchWithAuth("/api/v1/workbench/staff", token, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          staff_tier: tier,
          capabilities: tier === "staff" ? caps : [],
        }),
      });
      setEmail("");
      setCaps([]);
      setTier("staff");
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : "Failed");
    }
  }

  async function saveEdit(staffId: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetchWithAuth(`/api/v1/workbench/staff/${staffId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          staff_tier: editTier,
          capabilities: editTier === "staff" ? editCaps : [],
        }),
      });
      setEditingId(null);
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : "Update failed");
    }
  }

  function fillPolicyForm(p: Policy) {
    setEditingPolicyId(p.id);
    setPolicyForm({
      name: p.name,
      commissionPct: String((p.commission_rate_bps ?? 0) / 100),
      applies: p.commission_applies_to || "lead_owner",
      hourly: String((p.hourly_rate_cents ?? 0) / 100),
      terms: p.terms_markdown || "",
      isDefault: Boolean(p.is_default),
    });
  }

  async function savePolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !policyForm.name.trim()) return;
    setError(null);
    const body = {
      name: policyForm.name.trim(),
      commission_rate_bps: Math.round(parseFloat(policyForm.commissionPct || "0") * 100),
      commission_applies_to: policyForm.applies,
      hourly_rate_cents: Math.round(parseFloat(policyForm.hourly || "0") * 100),
      terms_markdown: policyForm.terms,
      is_default: policyForm.isDefault,
    };
    try {
      if (editingPolicyId) {
        await apiFetchWithAuth(`/api/v1/workbench/pay-policies/${editingPolicyId}`, token, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetchWithAuth("/api/v1/workbench/pay-policies", token, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setEditingPolicyId(null);
      setPolicyForm(emptyPolicyForm());
      await load(token);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : "Could not save pay package");
    }
  }

  async function createDefaultPolicy() {
    if (!token) return;
    await apiFetchWithAuth("/api/v1/workbench/pay-policies", token, {
      method: "POST",
      body: JSON.stringify({
        name: "Standard marketing package",
        is_default: true,
        commission_rate_bps: 500,
        commission_applies_to: "lead_owner",
        hourly_rate_cents: 2500,
        terms_markdown:
          "Commission applies to won sales where you are the lead owner (you generated the lead). An owner or partner may close the deal. Hourly rate applies to submitted time entries after acceptance.",
      }),
    });
    await load(token);
  }

  async function assignPolicy(staffId: string, policyId: string) {
    if (!token) return;
    await apiFetchWithAuth(`/api/v1/workbench/staff/${staffId}/pay-assignment`, token, {
      method: "POST",
      body: JSON.stringify({ policy_id: policyId }),
    });
    alert("Pay package assigned — staff must accept under My Pay.");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <WorkbenchPageHeader
        eyebrow="Team"
        title="Team"
        align="start"
        description="Staff profiles, tiers (Owner / Ops lead / Staff), capabilities, and pay packages."
      />
      {error && <p className="text-sm text-red-300">{error}</p>}

      <form onSubmit={(e) => void addStaff(e)} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-sm font-bold text-white">Add staff</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
            className="rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white"
            required
          />
          <WorkbenchSelect
            value={tier}
            onChange={setTier}
            options={TIER_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
          />
          <button type="submit" className="rounded-lg bg-accent-admin px-4 py-2 text-sm font-semibold text-black">
            Add staff
          </button>
        </div>
        {tier === "staff" ? (
          <div className="flex flex-wrap gap-3">
            {CAP_OPTIONS.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={caps.includes(c.id)}
                  onChange={() => toggleCap(caps, c.id, setCaps)}
                />
                {c.label}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">
            {tier === "owner"
              ? "Owner gets all capabilities automatically."
              : "Ops lead gets marketing, sales, support, and technician (not accounting / team)."}
          </p>
        )}
      </form>

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Pay packages</h2>
            <p className="mt-1 text-xs text-text-muted">
              Owners set commission and hourly terms. Staff accept an assignment under My Pay.
            </p>
          </div>
          {!policies.length && token ? (
            <button
              type="button"
              onClick={() => void createDefaultPolicy()}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Seed standard marketing package
            </button>
          ) : null}
        </div>
        {policies.length ? (
          <ul className="space-y-2">
            {policies.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {p.name}
                    {p.is_default ? (
                      <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-accent-admin">
                        default
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-text-muted">
                    {(p.commission_rate_bps ?? 0) / 100}% commission →{" "}
                    {APPLIES_OPTIONS.find((o) => o.value === p.commission_applies_to)?.label ||
                      p.commission_applies_to ||
                      "—"}
                    {" · "}${((p.hourly_rate_cents ?? 0) / 100).toFixed(2)}/hr
                    {p.active === false ? " · inactive" : ""}
                  </p>
                  {p.terms_markdown ? (
                    <p className="mt-1 max-w-2xl whitespace-pre-wrap text-xs text-white/50">{p.terms_markdown}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => fillPolicyForm(p)}
                  className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-muted">No packages yet. Create one below or seed the standard marketing package.</p>
        )}

        <form onSubmit={(e) => void savePolicy(e)} className="space-y-3 border-t border-white/10 pt-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-white/60">
            {editingPolicyId ? "Edit package" : "New package"}
          </h3>
          <input
            value={policyForm.name}
            onChange={(e) => setPolicyForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Package name"
            className="w-full rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white"
            required
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-text-muted">
              Commission %
              <input
                value={policyForm.commissionPct}
                onChange={(e) => setPolicyForm((f) => ({ ...f, commissionPct: e.target.value }))}
                type="number"
                step="0.1"
                min="0"
                className="mt-1 w-full rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-text-muted">
              Hourly rate (USD)
              <input
                value={policyForm.hourly}
                onChange={(e) => setPolicyForm((f) => ({ ...f, hourly: e.target.value }))}
                type="number"
                step="0.5"
                min="0"
                className="mt-1 w-full rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
          <WorkbenchSelect
            value={policyForm.applies}
            onChange={(v) => setPolicyForm((f) => ({ ...f, applies: v }))}
            options={APPLIES_OPTIONS}
          />
          <textarea
            value={policyForm.terms}
            onChange={(e) => setPolicyForm((f) => ({ ...f, terms: e.target.value }))}
            rows={4}
            placeholder="Terms shown when staff accept the package"
            className="w-full resize-y rounded-md border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white"
          />
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={policyForm.isDefault}
              onChange={(e) => setPolicyForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Mark as default package
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-lg bg-accent-admin px-4 py-2 text-sm font-semibold text-black">
              {editingPolicyId ? "Save package" : "Create package"}
            </button>
            {editingPolicyId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingPolicyId(null);
                  setPolicyForm(emptyPolicyForm());
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
        {staff.map((s) => (
          <li key={s.id} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{s.display_name || s.email}</p>
                <p className="text-sm text-text-muted">
                  {s.email} · {s.staff_tier_label || s.staff_tier}
                  {s.effective_capabilities?.length
                    ? ` · ${s.effective_capabilities.join(", ")}`
                    : null}
                </p>
                {s.pay_commission_applies_to === "closer" &&
                s.effective_capabilities?.includes("marketing") ? (
                  <p className="mt-1 text-xs text-amber-200/90">
                    Pay package {s.pay_policy_name ? `“${s.pay_policy_name}”` : ""} credits the closer only.
                    Marketing lead-gen will not be paid unless this is lead_owner or both_split.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(editingId === s.id ? null : s.id);
                    setEditTier(s.staff_tier || "staff");
                    setEditCaps(s.capabilities || []);
                  }}
                  className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                >
                  {editingId === s.id ? "Cancel" : "Edit roles"}
                </button>
                {policies.filter((p) => p.active !== false).length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <WorkbenchSelect
                      value={assignPick[s.id] || policies.find((p) => p.is_default)?.id || policies[0].id}
                      onChange={(v) => setAssignPick((prev) => ({ ...prev, [s.id]: v }))}
                      options={policies
                        .filter((p) => p.active !== false)
                        .map((p) => ({
                          value: p.id,
                          label: p.is_default ? `${p.name} (default)` : p.name,
                        }))}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void assignPolicy(
                          s.id,
                          assignPick[s.id] || policies.find((p) => p.is_default)?.id || policies[0].id,
                        )
                      }
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Assign package
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {editingId === s.id ? (
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <WorkbenchSelect
                  value={editTier}
                  onChange={setEditTier}
                  options={TIER_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
                />
                {editTier === "staff" ? (
                  <div className="flex flex-wrap gap-3">
                    {CAP_OPTIONS.map((c) => (
                      <label key={c.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={editCaps.includes(c.id)}
                          onChange={() => toggleCap(editCaps, c.id, setEditCaps)}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void saveEdit(s.id)}
                  className="rounded-lg bg-accent-admin px-3 py-1.5 text-xs font-semibold text-black"
                >
                  Save
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
