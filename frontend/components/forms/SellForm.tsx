"use client";

import { FormEvent, useState } from "react";

export function SellForm() {
  const [showNotice, setShowNotice] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowNotice(true);
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
        <label htmlFor="sell-email" className="mb-2 block text-xs font-semibold text-text-secondary">
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
        <label htmlFor="sell-company" className="mb-2 block text-xs font-semibold text-text-secondary">
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
        <label htmlFor="sell-phone" className="mb-2 block text-xs font-semibold text-text-secondary">
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
        <label htmlFor="sell-equipment" className="mb-2 block text-xs font-semibold text-text-secondary">
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
        <label htmlFor="sell-message" className="mb-2 block text-xs font-semibold text-text-secondary">
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
        className="w-full rounded-lg bg-accent-titanium py-4 text-sm font-semibold text-black transition hover:brightness-110"
      >
        Submit for Quote
      </button>
      {showNotice ? (
        <p className="rounded-lg border border-accent-titanium/20 bg-accent-titanium/10 px-4 py-3 text-center text-sm text-accent-titanium">
          Thanks — your quote request will be processed when the backend is connected in
          Phase 2. Call{" "}
          <a href="tel:9047426265" className="font-semibold underline">
            (904) 742-6265
          </a>{" "}
          for immediate assistance.
        </p>
      ) : null}
    </form>
  );
}
