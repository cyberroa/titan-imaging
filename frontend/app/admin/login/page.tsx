"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env-public";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const sp = useSearchParams();
  const err = sp.get("error");
  const supabaseOk = isSupabaseConfigured();

  async function signIn() {
    const supabase = createClient();
    const next = "/admin/parts";
    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {!supabaseOk ? (
        <div className="mb-8 max-w-lg rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100">
          <p className="font-semibold">Supabase env not loaded</p>
          <p className="mt-2 text-amber-100/90">
            Add <code className="text-white">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-white">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="text-white">frontend/.env.local</code>, then restart{" "}
            <code className="text-white">npm run dev</code>.
          </p>
        </div>
      ) : null}
      <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
        Titan Imaging
      </p>
      <h1 className="mt-3 text-3xl font-bold">Admin sign in</h1>
      <p className="mt-3 max-w-md text-text-secondary">
        Use your Google account. Access is limited to approved emails.
      </p>
      {err === "forbidden" ? (
        <p className="mt-6 text-sm text-red-400">This account is not allowed to access admin.</p>
      ) : null}
      {err === "auth" ? (
        <p className="mt-6 text-sm text-red-400">Sign-in failed. Please try again.</p>
      ) : null}
      <button
        type="button"
        disabled={!supabaseOk}
        onClick={() => void signIn()}
        className="mt-10 rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-accent-titanium disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue with Google
      </button>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginInner />
    </Suspense>
  );
}
