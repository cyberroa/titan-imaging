import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { IMAGES } from "@/lib/images";

const HOME_DESCRIPTION =
  "Precision CT/PET parts and seamless service for hospitals and imaging centers. Browse inventory, request support, and partner with Titan Imaging Service.";

export const metadata: Metadata = {
  title: "CT & PET Parts & Service",
  description: HOME_DESCRIPTION,
  openGraph: {
    title: "Titan Imaging Service | CT & PET Parts & Service",
    description: HOME_DESCRIPTION,
    url: "/",
  },
  twitter: {
    title: "Titan Imaging Service | CT & PET Parts & Service",
    description: HOME_DESCRIPTION,
  },
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-5 pb-14 pt-6 text-center md:min-h-[90vh]">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.titanBanner}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <p className="font-display text-xs uppercase tracking-[0.35em] text-accent-titanium opacity-90">
            CT/PET Parts &amp; Services
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Precision Parts. Seamless Service. Every Time.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-text-secondary md:text-xl">
            Trusted sourcing, repair, and support for medical imaging systems. Over
            30 years of hands-on expertise.
          </p>
          <HomeSearch />
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/inventory"
              className="rounded-lg bg-white px-8 py-4 text-sm font-semibold text-black transition hover:bg-accent-titanium"
            >
              Browse Inventory
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border-2 border-white px-8 py-4 text-sm font-semibold text-white transition hover:border-accent-titanium hover:text-accent-titanium"
            >
              Request Support
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-20">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.25em] text-accent-titanium">
            Industry Experience
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
            Trusted by Hospitals &amp; Imaging Centers
          </h2>
          <p className="mt-4 text-text-secondary">
            Titan Imaging Service provides high-quality CT and PET parts, system
            solutions, and service support to imaging centers and hospitals
            nationwide.
          </p>
          <p className="mt-4 text-text-secondary">
            With over 30 years of hands-on experience in GE PET/CT systems, our
            team ensures reliable installations, precise maintenance, and fast
            technical support.
          </p>
          <Link
            href="/about"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent-titanium"
          >
            Learn More
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-accent-titanium/20 to-transparent opacity-40" />
          <Image
            src={IMAGES.scan}
            alt="CT/PET imaging"
            width={640}
            height={380}
            className="relative h-[380px] w-full rounded-xl border border-white/10 object-cover"
          />
        </div>
      </section>

      <section className="bg-gradient-to-b from-black via-[#0a0a0a] to-black px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Our Core Services</h2>
          <p className="mx-auto mt-3 max-w-lg text-text-muted">
            End-to-end solutions for medical imaging—from parts to full system
            support
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Parts Sourcing", "OEM and refurbished CT/PET components for reliable performance."],
              ["System Sales", "Pre-owned and refurbished systems, professionally vetted."],
              ["Installation", "Professional system installation and calibration services."],
              ["Partner With Us", "Collaborate to expand your imaging service capabilities."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0d0d0d] to-[#111] p-8 text-center transition hover:-translate-y-1 hover:border-white/20"
              >
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Industry Insight</h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-muted">
            Expert insights on CT scanner installation, PET/CT systems, used
            medical imaging equipment, and industry best practices.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "How Much Does CT Scanner Installation Cost in 2026?",
              body: "Understand the full scope of CT installation costs including site preparation, rigging, compliance, and technical calibration requirements.",
              href: "/insights",
            },
            {
              title: "Complete Guide to Deinstalling a PET CT System Safely",
              body: "A step-by-step breakdown of safe PET CT system removal, transportation, and regulatory considerations for facilities.",
              href: "/insights",
              soon: true,
            },
            {
              title: "How to Sell a Used CT Scanner",
              body: "Learn how imaging centers can maximize value when selling used CT systems while minimizing downtime and risk.",
              href: "/insights",
              soon: true,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-xl border border-white/10 bg-[#0a0a0a] p-8 transition hover:-translate-y-1 hover:border-white/20"
            >
              <h3 className="text-base font-semibold leading-snug">{card.title}</h3>
              <p className="mt-4 flex-1 text-sm text-text-muted">{card.body}</p>
              {card.soon ? (
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent-titanium">
                  Coming Soon →
                </span>
              ) : (
                <Link
                  href={card.href}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent-titanium hover:gap-2"
                >
                  Read More →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold">Need Support?</h2>
        <p className="mt-3 text-text-muted">
          Speak directly with our team and get expert assistance today.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-block rounded-lg bg-white px-10 py-4 text-sm font-semibold text-black transition hover:bg-accent-titanium"
        >
          Contact Us
        </Link>
      </section>
    </>
  );
}
