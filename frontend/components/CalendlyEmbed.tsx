"use client";

import { getCalendlyInlineIframeSrc } from "@/lib/calendly";
import { useEffect, useState } from "react";

/**
 * Iframe embed avoids next/script + initInlineWidget races (common with App Router).
 * Calendly requires embed_domain to match the page host (incl. localhost:3000).
 */
export function CalendlyEmbed() {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    setIframeSrc(getCalendlyInlineIframeSrc(window.location.host));
  }, []);

  return (
    <div className="min-h-[700px] w-full min-w-[320px] overflow-hidden rounded-lg">
      {iframeSrc ? (
        <iframe
          title="Schedule an appointment with Titan Imaging"
          src={iframeSrc}
          className="h-[700px] w-full min-w-[320px] rounded-lg border-0"
          loading="lazy"
        />
      ) : (
        <div
          className="flex min-h-[700px] w-full items-center justify-center rounded-lg bg-background text-sm text-text-secondary"
          role="status"
        >
          Loading calendar…
        </div>
      )}
    </div>
  );
}
