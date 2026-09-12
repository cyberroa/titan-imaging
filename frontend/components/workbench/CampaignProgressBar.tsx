"use client";

type Progress = {
  total?: number;
  sent?: number;
  remaining?: number;
  failed?: number;
  days?: number;
  day_index?: number;
  percent?: number;
};

export function CampaignProgressBar({ progress }: { progress?: Progress | null }) {
  const total = progress?.total ?? 0;
  const sent = progress?.sent ?? 0;
  const remaining = progress?.remaining ?? 0;
  const failed = progress?.failed ?? 0;
  const pct = Math.min(100, Math.max(0, progress?.percent ?? 0));
  const days = progress?.days ?? 1;
  const day = progress?.day_index ?? 1;

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent-admin" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-white/55">
        {sent} sent · {remaining} left · {failed} failed · {total} total
        {total ? ` · day ${day} of ${days}` : ""}
      </p>
    </div>
  );
}
