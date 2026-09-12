import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  EngagementBadge,
  Glyph,
  OUTCOME_ICON,
  OUTCOME_TONE,
  STAGE_VISUAL,
  STAGES,
  stageTone,
  type LeadStage,
} from "@/components/workbench/EngagementVisuals";

export type AgentIntent = "log_engagement" | "draft_copy" | "lookup" | "research" | "note";

export type StudioAgentCustomerHit = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
};

export type StudioAgentResultData = {
  intent?: AgentIntent | string;
  engagement?: {
    id: string;
    outcome: string;
    summary: string;
    suggested_stage?: string | null;
    applied_stage?: string | null;
  } | null;
  lead_stage?: string | null;
  fit_scores?: { offer_family: string; score: number; reasons: string[] }[];
  next_actions?: { id: string; label: string; href?: string }[];
  draft_sale?: {
    customer_id: string;
    amount_cents: number | null;
    source_id: string;
    confirm_required: boolean;
  } | null;
  message: string;
  output_text?: string | null;
  customers?: StudioAgentCustomerHit[];
  task?: { id: string; kind?: string; status?: string } | null;
};

const FIT_COLOR: Record<string, string> = {
  parts: "#2BB4FF",
  used_system: "#34D399",
  new_system: "#FFFF84",
  audit: "#E07A5F",
};

const INTENT_TITLE: Record<string, string> = {
  log_engagement: "Engagement logged",
  draft_copy: "Draft ready",
  lookup: "Matching accounts",
  research: "Research queued",
  note: "Note saved",
};

function familyLabel(id: string) {
  return id.replaceAll("_", " ");
}

export function StudioAgentResult({
  result,
  customerHref,
  onPickCustomer,
}: {
  result: StudioAgentResultData;
  customerHref?: string | null;
  onPickCustomer?: (id: string) => void;
}) {
  const intent = result.intent || (result.engagement ? "log_engagement" : "lookup");
  const stage = result.lead_stage || "";
  const visual = STAGE_VISUAL[stage as LeadStage];
  const outcome = result.engagement?.outcome;
  const fits = [...(result.fit_scores ?? [])].sort((a, b) => b.score - a.score);
  const maxFit = Math.max(100, ...fits.map((f) => f.score), 1);

  const saleHref = result.draft_sale
    ? `/workbench/sales?customer=${result.draft_sale.customer_id}&engagement=${result.draft_sale.source_id}${
        result.draft_sale.amount_cents ? `&amount=${(result.draft_sale.amount_cents / 100).toFixed(2)}` : ""
      }`
    : null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-[#1c1c22] p-5 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-admin">
            Studio Agent
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {INTENT_TITLE[intent] || "Agent result"}
          </h2>
          {result.message ? (
            <p className="mt-1 text-sm text-text-muted">{result.message}</p>
          ) : null}
        </div>
        {customerHref ? (
          <Link
            href={customerHref}
            className="rounded-lg border border-accent-admin/40 bg-accent-admin/15 px-3 py-1.5 text-xs font-semibold text-accent-admin transition hover:bg-accent-admin/25"
          >
            Open dossier
          </Link>
        ) : null}
      </div>

      {intent === "lookup" && result.customers?.length ? (
        <ul className="mt-4 space-y-2">
          {result.customers.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPickCustomer?.(c.id)}
                className="flex w-full flex-col rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm hover:border-accent-admin/40"
              >
                <span className="font-semibold text-white">{c.company || c.name || c.email}</span>
                <span className="text-xs text-white/45">
                  {[c.name, c.email].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {intent === "lookup" && !result.customers?.length ? (
        <p className="mt-4 text-sm text-white/55">No matching accounts. Attach a customer from the picker below.</p>
      ) : null}

      {intent === "draft_copy" && result.output_text ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/90">
          {result.output_text}
        </pre>
      ) : null}

      {intent === "note" && result.output_text ? (
        <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
          {result.output_text}
        </pre>
      ) : null}

      {intent === "research" && result.task?.id ? (
        <p className="mt-4 text-xs text-white/45">Task {result.task.id.slice(0, 8)}… {result.task.status}</p>
      ) : null}

      {intent === "log_engagement" && result.engagement ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {stage ? (
              <EngagementBadge value={stage} icon={visual?.icon ?? "spark"} className={stageTone(stage)} />
            ) : null}
            {outcome ? (
              <EngagementBadge
                value={outcome}
                icon={OUTCOME_ICON[outcome] ?? "flag"}
                className={OUTCOME_TONE[outcome] ?? "border-white/20 bg-white/10 text-white/70"}
              />
            ) : null}
            {result.engagement.suggested_stage &&
            result.engagement.suggested_stage !== result.engagement.applied_stage ? (
              <EngagementBadge
                value={`suggested ${result.engagement.suggested_stage}`}
                icon="star"
                className="border-accent-caution/40 bg-accent-caution/10 text-accent-caution"
              />
            ) : null}
          </div>

          {visual ? (
            <div className={cn("mt-4 grid gap-2 sm:grid-cols-7")}>
              {STAGES.map((s) => {
                const v = STAGE_VISUAL[s];
                const active = s === stage;
                return (
                  <div
                    key={s}
                    className={cn(
                      "rounded-xl border px-2 py-2",
                      v.bg,
                      active ? "ring-2 ring-accent-admin/70" : v.border,
                      !active && "opacity-40",
                    )}
                    style={{ color: v.color }}
                  >
                    <Glyph name={v.icon} className="h-3.5 w-3.5" />
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: v.color }}>
                      {s}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {result.engagement.summary ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Summary</p>
              <p className="mt-2 text-sm leading-relaxed text-white/90">{result.engagement.summary}</p>
            </div>
          ) : null}

          {fits.length ? (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Offer fit</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {fits.map((f) => {
                  const color = FIT_COLOR[f.offer_family] ?? "#a9b4c2";
                  const pct = Math.min(100, Math.round((f.score / maxFit) * 100));
                  return (
                    <div key={f.offer_family} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold capitalize text-white">{familyLabel(f.offer_family)}</p>
                        <p className="font-mono text-sm text-white">{f.score.toFixed(0)}</p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      {f.reasons?.length ? (
                        <p className="mt-2 line-clamp-2 text-xs text-text-muted">{f.reasons.join(" · ")}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {saleHref ? (
          <Link
            href={saleHref}
            className="rounded-lg bg-accent-admin px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110"
          >
            Confirm sale on Sales
          </Link>
        ) : null}
        {result.next_actions?.map((a, idx) =>
          a.href ? (
            <Link
              key={a.id}
              href={a.href}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition",
                !saleHref && idx === 0
                  ? "bg-accent-admin text-black hover:brightness-110"
                  : "border border-accent-admin/40 bg-accent-admin/15 text-accent-admin hover:bg-accent-admin/25",
              )}
            >
              {a.label}
            </Link>
          ) : (
            <span key={a.id} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/45">
              {a.label}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
