import type { Metadata } from "next";
import Link from "next/link";
import { ServiceAccordion } from "@/components/ServiceAccordion";
import { SERVICES } from "@/lib/services-data";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Installation, logistics, training, system sales, service contracts, and parts support for PET/CT.",
  openGraph: {
    title: "Services | TITAN IMAGING",
    description:
      "Installation, logistics, training, system sales, service contracts, and parts support for PET/CT.",
    url: "/services",
  },
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesPage() {
  return (
    <>
      <section className="px-6 pb-12 pt-8 text-center">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          What We Offer
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          CT &amp; PET Solutions That Keep You Running
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
          Comprehensive services designed to maximize uptime, optimize performance, and
          support your imaging operations from installation to ongoing maintenance.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-12">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Our Services</h2>
          <p className="mt-2 text-text-muted">Tap a service to expand details</p>
        </div>
        <ServiceAccordion items={SERVICES} />
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 pb-16 sm:grid-cols-4">
        {[
          ["25+", "States Served"],
          ["100+", "System Audits"],
          ["1,500+", "Projects Completed"],
          ["30+", "Years Experience"],
        ].map(([num, label]) => (
          <div key={label} className="text-center">
            <p className="font-display text-3xl font-bold text-accent-titanium md:text-4xl">
              {num}
            </p>
            <p className="mt-1 text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <section className="mx-auto max-w-2xl px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
        <p className="mt-3 text-text-muted">
          Whether you need a system audit, installation support, or a quote—we&apos;re
          here to help.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-accent-titanium"
          >
            Contact Us
          </Link>
          <Link
            href="/inventory"
            className="rounded-lg border-2 border-white/20 px-8 py-3 text-sm font-semibold text-white transition hover:border-accent-titanium hover:text-accent-titanium"
          >
            Browse Inventory
          </Link>
        </div>
      </section>
    </>
  );
}
