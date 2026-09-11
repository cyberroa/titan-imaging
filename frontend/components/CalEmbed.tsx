"use client";

import { getCalComEmbedUrl } from "@/lib/cal-com";
import { useEffect, useState } from "react";

const INITIAL_HEIGHT = 520;

function calIframeHeight(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const msg = data as {
    originator?: string;
    type?: string;
    method?: string;
    data?: { iframeHeight?: number };
    arg?: { iframeHeight?: number };
  };
  if (msg.originator !== "CAL") return null;
  const kind = String(msg.type ?? msg.method ?? "");
  if (!kind.includes("__dimensionChanged")) return null;
  const height = msg.data?.iframeHeight ?? msg.arg?.iframeHeight;
  return typeof height === "number" && height > 0 ? Math.ceil(height) : null;
}

export function CalEmbed() {
  const iframeSrc = getCalComEmbedUrl();
  const [height, setHeight] = useState(INITIAL_HEIGHT);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const origin = event.origin;
      try {
        const host = new URL(origin).hostname;
        if (host !== "cal.com" && !host.endsWith(".cal.com")) return;
      } catch {
        return;
      }
      const next = calIframeHeight(event.data);
      if (next) setHeight(next);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!iframeSrc) {
    return (
      <div
        className="flex min-h-40 w-full items-center justify-center rounded-lg bg-background px-6 py-10 text-center text-sm text-text-secondary"
        role="status"
      >
        Calendar is not configured. Set NEXT_PUBLIC_CAL_COM_URL to your Cal.com event link.
      </div>
    );
  }

  return (
    <div className="w-full min-w-[320px] overflow-hidden rounded-lg leading-none">
      <iframe
        title="Schedule an appointment with Titan Imaging"
        src={iframeSrc}
        style={{ height }}
        className="block w-full min-w-[320px] border-0"
        loading="lazy"
        allow="payment"
      />
    </div>
  );
}
