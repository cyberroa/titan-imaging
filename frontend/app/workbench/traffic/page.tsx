"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkbenchPageHeader } from "@/components/ui";
import { WorkbenchSelect } from "@/components/workbench/WorkbenchSelect";
import { ApiError } from "@/lib/api";
import { graphqlQuery } from "@/lib/workbench-graphql";
import { createClient } from "@/lib/supabase/client";

type Traffic = {
  range: string;
  pageviews: number;
  events: number;
  unique_sessions: number;
  top_pages: { path: string; views: number }[];
  sources: { source: string; views: number }[];
};

const RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
];

export default function SiteTrafficPage() {
  const [token, setToken] = useState<string | null>(null);
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<Traffic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (t: string, r: string) => {
      setError(null);
      try {
        const row = await graphqlQuery<{
          siteStats: Traffic;
        }>(
          t,
          `query SiteStats($range: String!) {
            siteStats(range: $range) {
              range
              pageviews
              events
              unique_sessions: uniqueSessions
              top_pages: topPages { path views }
              sources { source views }
            }
          }`,
          { range: r },
        );
        setData(row.siteStats);
      } catch (e) {
        setError(e instanceof ApiError ? JSON.stringify(e.body ?? e.message) : "Failed to load");
      }
    },
    [],
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.access_token) void load(session.access_token, range);
    });
  }, [load, range]);

  return (
    <>
      <WorkbenchPageHeader
        eyebrow="Analytics"
        title="Site traffic"
        description="First-party pageviews and sources from consented public-site activity."
      />
      <div className="mt-8 flex justify-end">
        <label className="flex w-max items-center gap-2.5 text-xs">
          <span className="text-white/45">Time range:</span>
          <WorkbenchSelect
            fitToOptions
            value={range}
            onChange={(v) => {
              setRange(v);
              if (token) void load(token, v);
            }}
            options={RANGES}
          />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Unique sessions", data?.unique_sessions ?? "—"],
          ["Pageviews", data?.pageviews ?? "—"],
          ["Events", data?.events ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#101314] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-5">
          <h2 className="font-semibold">Top pages</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.top_pages || []).map((p) => (
              <li key={p.path} className="flex justify-between gap-3 text-white/70">
                <span className="truncate">{p.path}</span>
                <span>{p.views}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 p-5">
          <h2 className="font-semibold">Sources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.sources || []).map((s) => (
              <li key={s.source} className="flex justify-between gap-3 text-white/70">
                <span className="truncate">{s.source}</span>
                <span>{s.views}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
