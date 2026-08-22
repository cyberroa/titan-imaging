import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import {
  Container,
  Eyebrow,
  LinkButton,
  PageHero,
  Section,
  SectionHeading,
} from "@/components/ui";
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
      <PageHero
        size="home"
        image={IMAGES.titanBanner}
        eyebrow="CT/PET Parts & Services"
        title="Precision Parts. Seamless Service. Every Time."
        subtitle="Trusted sourcing, repair, and support for medical imaging systems. Over 30 years of hands-on expertise."
      >
        <HomeSearch />
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <LinkButton href="/inventory" size="lg">
            Browse Inventory
          </LinkButton>
          <LinkButton href="/contact" variant="secondary" size="lg">
            Request Support
          </LinkButton>
        </div>
      </PageHero>

      <Section spacing="standard">
        <Container className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>Industry Experience</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Trusted by Hospitals &amp; Imaging Centers
            </h2>
            <p className="mt-4 text-text-secondary">
              Titan Imaging Service provides high-quality CT and PET parts, system solutions, and
              service support to imaging centers and hospitals nationwide.
            </p>
            <p className="mt-4 text-text-secondary">
              With over 30 years of hands-on experience in GE PET/CT systems, our team ensures
              reliable installations, precise maintenance, and fast technical support.
            </p>
            <LinkButton href="/about" size="sm" className="mt-8">
              Learn More
            </LinkButton>
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
        </Container>
      </Section>

      <Section spacing="standard" className="bg-gradient-to-b from-black via-background-card to-black">
        <Container>
          <SectionHeading
            title="Our Core Services"
            description="End-to-end solutions for medical imaging—from parts to full system support"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Parts Sourcing", "OEM and refurbished CT/PET components for reliable performance."],
              ["System Sales", "Pre-owned and refurbished systems, professionally vetted."],
              ["Installation", "Professional system installation and calibration services."],
              ["Partner With Us", "Collaborate to expand your imaging service capabilities."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-background-card to-background-raised p-8 text-center transition hover:-translate-y-1 hover:border-white/20"
              >
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm text-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="standard">
        <Container>
          <SectionHeading
            title="Industry Insight"
            description="Expert insights on CT scanner installation, PET/CT systems, used medical imaging equipment, and industry best practices."
          />
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
                className="flex flex-col rounded-xl border border-white/10 bg-background-card p-8 transition hover:-translate-y-1 hover:border-white/20"
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
        </Container>
      </Section>

      <Section spacing="standard" className="pb-24">
        <Container maxWidth="narrow" className="text-center">
          <SectionHeading title="Need Support?" description="Speak directly with our team and get expert assistance today." />
          <LinkButton href="/contact" size="lg" className="mt-8 px-10">
            Contact Us
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}
