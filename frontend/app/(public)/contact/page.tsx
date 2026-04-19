import type { Metadata } from "next";
import Image from "next/image";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";
import { ContactForm } from "@/components/forms/ContactForm";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach Titan Imaging Service for PET/CT parts, service, scheduling, and support.",
  openGraph: {
    title: "Contact Us | TITAN IMAGING",
    description: "Reach Titan Imaging Service for PET/CT parts, service, scheduling, and support.",
    url: "/contact",
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <section className="relative flex min-h-[42vh] flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-4 text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.customerService}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/75 to-black" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
            Get in Touch
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">We&apos;re Here to Help</h1>
          <p className="mx-auto mt-4 max-w-lg text-text-secondary">
            Have a question about our PET/CT services, inventory, or need a quote? Reach out—we
            typically respond within 24 hours.
          </p>
          <div className="mx-auto mt-8 flex flex-wrap justify-center gap-8 text-sm font-semibold">
            <a
              href="tel:9047426265"
              className="flex items-center gap-2 text-text-secondary transition hover:text-accent-titanium"
            >
              <span className="text-accent-titanium" aria-hidden>
                ☎
              </span>
              (904) 742-6265
            </a>
            <a
              href="mailto:info@test.com"
              className="flex items-center gap-2 text-text-secondary transition hover:text-accent-titanium"
            >
              <span className="text-accent-titanium" aria-hidden>
                ✉
              </span>
              info@test.com
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-14 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-white/10 bg-background-raised/95 p-8 shadow-xl shadow-black/30">
          <div className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-[0.15em] text-accent-titanium">
              Send Us a Message
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Fill out the form below. Backend delivery arrives in Phase 2.
            </p>
          </div>
          <ContactForm />
        </div>

        <div className="rounded-xl border border-white/10 bg-background-raised/95 p-8 shadow-xl shadow-black/30">
          <div className="mb-6">
            <h2 className="font-display text-sm uppercase tracking-[0.15em] text-accent-titanium">
              Ready to Schedule?
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Book a call at a time that works for you (Calendly).
            </p>
          </div>
          <CalendlyEmbed />
        </div>
      </div>
    </>
  );
}
