/**
 * Shared Tailwind class bundles for admin pages (`data-area="admin"`).
 * Use accent-admin (McLaren papaya) so backend UI is visually distinct from public ice theme.
 */
export const adminBtnPrimary =
  "rounded-lg bg-accent-admin px-6 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const adminBtnSecondary =
  "rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent-admin hover:bg-accent-admin/5 hover:text-accent-admin disabled:opacity-50";

export const adminLink = "text-accent-admin hover:underline";

export const adminMono = "font-mono text-xs text-accent-admin";

export const adminInput =
  "mt-1 w-full rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 outline-none ring-accent-admin/25 focus:border-accent-admin/40 focus:ring-2";

export const adminCard =
  "rounded-xl border border-white/12 bg-white/[0.035] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.25)]";

export const adminTableWrap =
  "overflow-x-auto rounded-xl border border-white/12 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export const adminTableHead =
  "border-b border-white/10 bg-white/[0.04] text-text-muted";

export const adminTableRow = "border-b border-white/5 hover:bg-accent-admin/[0.04]";
