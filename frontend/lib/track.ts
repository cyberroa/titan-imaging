"use client";

import { getApiBaseUrl } from "@/lib/api";

const COOKIE_NAME = "ti_sid";
const CONSENT_NAME = "ti_consent";

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_TRACKING === "false") return false;
  return hasConsent();
}

export function hasConsent(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${CONSENT_NAME}=`))
      ?.split("=")[1] === "yes"
  );
}

export function setConsent(value: "yes" | "no") {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (value === "no") {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const row = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.split("=")[1]) : null;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as { randomUUID: () => string }).randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getCookieId(): string | null {
  if (!isEnabled()) return null;
  let id = readCookie(COOKIE_NAME);
  if (!id) {
    id = randomId();
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
  return id;
}

type TrackPayload = Record<string, unknown>;

export async function track(
  type: string,
  payload: TrackPayload = {},
  opts: { email?: string } = {},
): Promise<void> {
  if (!isEnabled() && !opts.email) return;

  const cookieId = getCookieId();
  const url = typeof window !== "undefined" ? window.location.href : undefined;
  const referrer =
    typeof document !== "undefined" && document.referrer ? document.referrer : undefined;

  const body = JSON.stringify({
    type,
    url,
    cookie_id: cookieId,
    email: opts.email,
    payload: { ...payload, referrer },
  });

  const endpoint = `${getApiBaseUrl()}/api/v1/events`;
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // never break the UX on tracking failure
  }
}

export async function identify(email: string) {
  if (!email) return;
  await track("identify", {}, { email });
}

export function trackPageView() {
  if (!isEnabled()) return;
  void track("page_view");
}
