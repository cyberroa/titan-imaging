import type { Metadata } from "next";
import Image from "next/image";
import {
  Container,
  Eyebrow,
  LinkButton,
  PageHero,
  Section,
  SectionHeading,
} from "@/components/ui";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "About Us",
  description: "Specialists in PET/CT solutions—decades of GE experience, nationwide support.",
  openGraph: {
    title: "About Us | TITAN IMAGING",
    description: "Specialists in PET/CT solutions—decades of GE experience, nationwide support.",
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
      <PageHero
        image={IMAGES.aboutUs}
        eyebrow="About Titan Imaging Service"
        title="Quality & Expertise You Deserve"
        subtitle="Three decades of hands-on PET/CT excellence. Trusted by hospitals and imaging centers nationwide."
      />

      <Container className="pb-20">
        <Section spacing="standard" className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <Eyebrow>Who We Are</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Specialists in PET/CT Solutions</h2>
            <p className="mt-4 text-text-secondary">
              At <strong className="text-white">Titan Imaging Service</strong>, we provide
              comprehensive PET/CT solutions tailored to hospitals, imaging centers, and private
              practices. Founded in 2021 in Jacksonville, Florida, our mission is to deliver
              reliable, high-quality imaging services that keep systems running smoothly and
              patients cared for.
            </p>
            <p className="mt-4 text-text-secondary">
              With decades of experience in the imaging industry, our owner brings over 30 years of
              hands-on expertise with GE PET/CT systems—including installations, de-installations,
              modifications, and sales of refurbished systems and parts. Prior to founding Titan
              Imaging, they served as a Regional PET/CT Zone Support Engineer at{" "}
              <strong className="text-white">GE Healthcare</strong>, training field engineers,
              conducting system audits, and overseeing major PET/CT installations across the
              Southeast.
            </p>
            <p className="mt-4 text-text-secondary">
              Our team prides itself on technical precision: aligning complex systems,
              troubleshooting performance issues, and optimizing operations. We&apos;ve conducted
              over 100 PET/CT system audits to ensure compliance, reduce downtime, and minimize
              costs for our clients.
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
        </Section>

        <Section spacing="tight">
          <SectionHeading
            title="What Drives Us"
            description="The principles that guide every project we undertake"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-white/10 bg-background-card p-8 text-left"
              >
                <div className="text-2xl text-accent-titanium" aria-hidden>
                  {v.icon}
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section spacing="tight" className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="font-display text-3xl font-bold text-accent-titanium md:text-4xl">
                {n}
              </p>
              <p className="mt-1 text-sm text-text-muted">{l}</p>
            </div>
          ))}
        </Section>

        <Section spacing="standard" className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <Eyebrow>Our Expertise</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Built on Decades of GE PET/CT Mastery
            </h2>
            <p className="mt-4 text-text-secondary">
              At Titan Imaging, we combine in-depth knowledge of imaging technologies with hands-on
              experience to provide services that hospitals and imaging centers can trust.
            </p>
            <p className="mt-4 text-text-secondary">
              Uptime, accuracy, and customer satisfaction are our top priorities. From installations
              to audits, we bring the same rigor and precision that defined GE Healthcare&apos;s
              standards—now applied directly to your facility.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background-card p-10">
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
        </Section>

        <Section spacing="standard" className="rounded-2xl bg-gradient-to-b from-transparent via-background-card to-transparent text-center">
          <SectionHeading
            title="Ready to Partner With Us?"
            description="Whether you need a system audit, installation support, or refurbished equipment—we're here to help."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton href="/contact">Get in Touch</LinkButton>
            <LinkButton href="/services" variant="secondary" className="border-white/25">
              View Our Services
            </LinkButton>
          </div>
        </Section>
      </Container>
    </>
  );
}
