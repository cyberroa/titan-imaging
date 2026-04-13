"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [showNotice, setShowNotice] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowNotice(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className="mb-2 block text-xs font-semibold text-text-secondary">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          placeholder="Your name"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-2 block text-xs font-semibold text-text-secondary">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="contact-phone" className="mb-2 block text-xs font-semibold text-text-secondary">
          Phone <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          placeholder="(555) 555-5555"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="mb-2 block text-xs font-semibold text-text-secondary">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          placeholder="How can we help?"
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-2 block text-xs font-semibold text-text-secondary">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="Tell us more…"
          className="min-h-[120px] w-full resize-y rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none ring-accent-titanium/20 placeholder:text-text-muted focus:ring-2"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-accent-titanium py-4 text-sm font-semibold text-black transition hover:brightness-110"
      >
        Send Message
      </button>
      {showNotice ? (
        <p className="rounded-lg border border-accent-titanium/20 bg-accent-titanium/10 px-4 py-3 text-center text-sm text-accent-titanium">
          Thanks for reaching out. Online submissions will be delivered to our team in
          Phase 2. For immediate help, call{" "}
          <a href="tel:9047426265" className="font-semibold underline">
            (904) 742-6265
          </a>
          .
        </p>
      ) : null}
      <p className="border-t border-white/10 pt-4 text-xs leading-relaxed text-text-muted">
        <strong className="text-text-secondary">Security note:</strong> Be cautious of anyone
        impersonating Titan Imaging Service. Verify by calling{" "}
        <a href="tel:9047426265" className="text-accent-titanium underline">
          (904) 742-6265
        </a>{" "}
        or emailing{" "}
        <a href="mailto:info@test.com" className="text-accent-titanium underline">
          info@test.com
        </a>
        .
      </p>
    </form>
  );
}
