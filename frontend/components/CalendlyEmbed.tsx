"use client";

import { CALENDLY_EMBED_URL } from "@/lib/calendly";
import Script from "next/script";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string;
        parentElement: HTMLElement;
      }) => void;
    };
  }
}

export function CalendlyEmbed() {
  const parentRef = useRef<HTMLDivElement>(null);

  const init = useCallback(() => {
    const el = parentRef.current;
    if (!el || !window.Calendly) return;
    el.innerHTML = "";
    window.Calendly.initInlineWidget({
      url: CALENDLY_EMBED_URL,
      parentElement: el,
    });
  }, []);

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={init}
      />
      <div
        ref={parentRef}
        className="calendly-inline-widget min-h-[700px] w-full min-w-[320px] overflow-hidden rounded-lg"
      />
    </>
  );
}
