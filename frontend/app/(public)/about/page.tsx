import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Specialists in PET/CT solutions—decades of GE experience, nationwide support.",
  openGraph: {
    title: "About Us | TITAN IMAGING",
    description:
      "Specialists in PET/CT solutions—decades of GE experience, nationwide support.",
    url: "/about",
  },
  alternates: {
    canonical: "/about",
  },
};

const values = [
  {
    icon: "⚡",
    title: "Uptime First",
    body: "Minimizing downtime so your facility stays operational and patients receive care without delay.",
  },
  {
    icon: "○",
    title: "Technical Precision",
    body: "Rigorous alignment, calibration, and optimization to ensure imaging accuracy you can trust.",
  },
  {
    icon: "✓",
    title: "Compliance & Audits",
    body: "Over 100 system audits completed to verify performance specs and reduce operational costs.",
  },
  {
    icon: "◇",
    title: "Customer Partnership",
    body: "We don't just fix systems—we build lasting relationships with facilities we support.",
  },
];

const stats = [
  ["25+", "States Served"],
  ["10+", "Countries Reached"],
  ["1,500+", "Projects Completed"],
  ["800+", "Facilities Supported"],
];

export default function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[45vh] flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-4 text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.aboutUs}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/75 to-black" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
            About Titan Imaging Service
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Quality &amp; Expertise You Deserve</h1>
          <p className="mt-4 text-lg text-text-secondary">
            Three decades of hands-on PET/CT excellence. Trusted by hospitals and imaging
            centers nationwide.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <section className="grid gap-12 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.2em] text-accent-titanium">
              Who We Are
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Specialists in PET/CT Solutions
            </h2>
            <p className="mt-4 text-text-secondary">
              At <strong className="text-white">Titan Imaging Service</strong>, we provide
              comprehensive PET/CT solutions tailored to hospitals, imaging centers, and
              private practices. Founded in 2021 in Jacksonville, Florida, our mission is
              to deliver reliable, high-quality imaging services that keep systems running
              smoothly and patients cared for.
            </p>
            <p className="mt-4 text-text-secondary">
              With decades of experience in the imaging industry, our owner brings over
              30 years of hands-on expertise with GE PET/CT systems—including installations,
              de-installations, modifications, and sales of refurbished systems and parts.
              Prior to founding Titan Imaging, they served as a Regional PET/CT Zone
              Support Engineer at <strong className="text-white">GE Healthcare</strong>,
              training field engineers, conducting system audits, and overseeing major
              PET/CT installations across the Southeast.
            </p>
            <p className="mt-4 text-text-secondary">
              Our team prides itself on technical precision: aligning complex systems,
              troubleshooting performance issues, and optimizing operations. We&apos;ve
              conducted over 100 PET/CT system audits to ensure compliance, reduce downtime,
              and minimize costs for our clients.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-accent-titanium/25 to-transparent opacity-30" />
            <Image
              src={IMAGES.aboutTitant}
              alt="Titan Imaging technician working on PET/CT system"
              width={640}
              height={420}
              className="relative rounded-xl border border-white/10 object-cover"
            />
          </div>
        </section>

        <section className="py-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">What Drives Us</h2>
          <p className="mx-auto mt-2 max-w-lg text-text-muted">
            The principles that guide every project we undertake
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-white/10 bg-[#0a0a0a] p-8 text-left"
              >
                <div className="text-2xl text-accent-titanium" aria-hidden>
                  {v.icon}
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
          {stats.map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="font-display text-3xl font-bold text-accent-titanium md:text-4xl">
                {n}
              </p>
              <p className="mt-1 text-sm text-text-muted">{l}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-10 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.2em] text-accent-titanium">
              Our Expertise
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Built on Decades of GE PET/CT Mastery
            </h2>
            <p className="mt-4 text-text-secondary">
              At Titan Imaging, we combine in-depth knowledge of imaging technologies with
              hands-on experience to provide services that hospitals and imaging centers
              can trust.
            </p>
            <p className="mt-4 text-text-secondary">
              Uptime, accuracy, and customer satisfaction are our top priorities. From
              installations to audits, we bring the same rigor and precision that defined
              GE Healthcare&apos;s standards—now applied directly to your facility.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-10">
            <p className="font-display text-5xl font-bold text-accent-titanium">100+</p>
            <p className="mt-1 text-text-muted">PET/CT System Audits</p>
            <ul className="mt-8 space-y-3 text-sm text-text-secondary">
              {[
                "Performance specification compliance",
                "Downtime reduction strategies",
                "Cost optimization",
                "Field engineer training",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent-titanium">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent py-16 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to Partner With Us?</h2>
          <p className="mx-auto mt-3 max-w-lg text-text-muted">
            Whether you need a system audit, installation support, or refurbished
            equipment—we&apos;re here to help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-accent-titanium"
            >
              Get in Touch
            </Link>
            <Link
              href="/services"
              className="rounded-lg border-2 border-white/25 px-8 py-3 text-sm font-semibold text-white transition hover:border-accent-titanium hover:text-accent-titanium"
            >
              View Our Services
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
