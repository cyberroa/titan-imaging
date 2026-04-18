"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { identify, track } from "@/lib/track";

export function SellForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const equipment = String(fd.get("equipment") ?? "").trim();

    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      company: String(fd.get("company") ?? "").trim() || undefined,
      part_details: equipment || "N/A",
      message: String(fd.get("message") ?? "").trim() || undefined,
    };

    setStatus("sending");
    try {
      await apiFetch<{ ok: boolean }>("/api/v1/sell", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (payload.email) {
        void identify(payload.email);
      }
      void track(
        "sell_submit",
        { company: payload.company ?? null },
        { email: payload.email || undefined },
      );
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="sell-name" className="mb-2 block text-xs font-semibold text-text-secondary">
          Name
        </label>
        <input
          id="sell-name"
          name="name"
          type="text"
          required
          placeholder="Your name"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="sell-email"
          className="mb-2 block text-xs font-semibold text-text-secondary"
        >
          Email
        </label>
        <input
          id="sell-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="sell-company"
          className="mb-2 block text-xs font-semibold text-text-secondary"
        >
          Company <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="sell-company"
          name="company"
          type="text"
          placeholder="Facility or company name"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="sell-phone"
          className="mb-2 block text-xs font-semibold text-text-secondary"
        >
          Phone <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="sell-phone"
          name="phone"
          type="tel"
          placeholder="(555) 555-5555"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="sell-equipment"
          className="mb-2 block text-xs font-semibold text-text-secondary"
        >
          Equipment details
        </label>
        <textarea
          id="sell-equipment"
          name="equipment"
          rows={4}
          placeholder="Equipment type, model, condition, quantity…"
          className="min-h-[100px] w-full resize-y rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="sell-message"
          className="mb-2 block text-xs font-semibold text-text-secondary"
        >
          Message <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="sell-message"
          name="message"
          rows={3}
          placeholder="Anything else we should know?"
          className="w-full resize-y rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-accent-titanium py-4 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "sending" ? "Submitting…" : "Submit for Quote"}
      </button>
      {status === "sent" ? (
        <p className="rounded-lg border border-accent-titanium/20 bg-accent-titanium/10 px-4 py-3 text-center text-sm text-accent-titanium">
          Thanks — we received your request. Call{" "}
          <a href="tel:9047426265" className="font-semibold underline">
            (904) 742-6265
          </a>{" "}
          for immediate assistance.
        </p>
      ) : status === "error" ? (
        <p className="rounded-lg border border-white/10 bg-background-card px-4 py-3 text-center text-sm text-text-secondary">
          Something went wrong submitting your request. Please try again, or call{" "}
          <a href="tel:9047426265" className="font-semibold text-accent-titanium underline">
            (904) 742-6265
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}
