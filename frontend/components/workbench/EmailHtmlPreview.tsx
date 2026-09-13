"use client";

import { useState } from "react";

type Props = {
  subject: string;
  html: string;
  text: string;
};

export function EmailHtmlPreview({ subject, html, text }: Props) {
  const [width, setWidth] = useState<"desktop" | "mobile">("desktop");
  const frameWidth = width === "mobile" ? 375 : 600;

  return (
    <div className="rounded-xl border border-white/10 bg-background-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Subject</p>
          <p className="truncate text-sm font-medium text-white">{subject}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-xs ${width === "desktop" ? "border-accent-admin text-accent-admin" : "border-white/15 text-white/55"}`}
            onClick={() => setWidth("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-xs ${width === "mobile" ? "border-accent-admin text-accent-admin" : "border-white/15 text-white/55"}`}
            onClick={() => setWidth("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-auto rounded-md bg-white p-3">
        <iframe
          title="Email HTML preview"
          srcDoc={html}
          sandbox=""
          className="mx-auto block border-0 bg-white"
          style={{ width: frameWidth, height: 640 }}
        />
      </div>
      <details className="mt-3 text-xs text-white/45">
        <summary className="cursor-pointer">Plain text</summary>
        <pre className="mt-2 whitespace-pre-wrap text-text-muted">{text}</pre>
      </details>
    </div>
  );
}
