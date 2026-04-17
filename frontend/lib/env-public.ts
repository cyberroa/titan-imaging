/**
 * NEXT_PUBLIC_* vars are inlined at build time; restart `npm run dev` after changing .env.local.
 */
export function isSupabaseConfigured(): boolean {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(u && k);
}
