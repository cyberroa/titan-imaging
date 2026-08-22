import Image from "next/image";
import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { GeHealthcareMark, PetCtMark, TitanMark } from "@/components/prototype/BrandMarks";
import { NewsletterCapture } from "@/components/prototype/NewsletterCapture";
import {
  IconExchange,
  IconExperience,
  IconParts,
  IconWrench,
} from "@/components/prototype/TrustIcons";
import { Eyebrow, LinkButton } from "@/components/ui";
import { IMAGES } from "@/lib/images";
import { cn } from "@/lib/cn";

const TRUST_ITEMS = [
  {
    Icon: IconExperience,
    label: "30+ years GE PET/CT",
    detail: "Hands-on field expertise across installations, service, and system support.",
  },
  {
    Icon: IconWrench,
    label: "Repair & service",
    detail: "Uptime-first field service, maintenance, and technical support.",
  },
  {
    Icon: IconExchange,
    label: "Buy & sell systems",
    detail: "Vetted refurbished GE PET/CT transactions end to end.",
  },
  {
    Icon: IconParts,
    label: "Parts nationwide",
    detail: "OEM and refurbished components shipped when you need them.",
  },
] as const;

const CAPABILITIES = [
  {
    eyebrow: "Repair & service",
    title: "Keep imaging systems online",
    body: "Field service, preventive maintenance, and technical support for GE PET/CT—so hospitals and imaging centers stay operational with less downtime.",
    cta: { href: "/services", label: "View services" },
    image: IMAGES.aboutTitant,
    imageAlt: "Technician supporting a PET/CT system",
    imagePosition: "object-[center_30%]",
    reverse: false,
    tone: "ice",
  },
  {
    eyebrow: "Buy & sell",
    title: "Move systems with confidence",
    body: "Source refurbished GE PET/CT systems or sell equipment you no longer need. We handle evaluation, logistics, and installation coordination end to end.",
    cta: { href: "/sell", label: "Sell to us" },
    secondaryCta: { href: "/inventory", label: "Browse inventory" },
    image: IMAGES.servicesImage,
    imageAlt: "Medical imaging suite",
    imagePosition: "object-center",
    reverse: true,
    tone: "raised",
  },
  {
    eyebrow: "Parts & sourcing",
    title: "OEM and refurbished components, fast",
    body: "Rapid access to quality CT/PET parts with expert guidance—so replacements land when your team needs them.",
    cta: { href: "/inventory", label: "Search parts" },
    image: IMAGES.sellImage,
    imageAlt: "Imaging equipment and parts context",
    imagePosition: "object-center",
    reverse: false,
    tone: "ice",
  },
] as const;

function sectionTone(tone: "ice" | "raised" | "plain") {
  if (tone === "ice") {
    return "bg-gradient-to-b from-[#0a1520] via-[#081018] to-[#0a1218]";
  }
  if (tone === "raised") {
    return "bg-gradient-to-b from-[#101820] via-[#0c141c] to-[#0a1218]";
  }
  return "bg-gradient-to-b from-[#0c1218] to-[#080e14]";
}

export function PrototypeHome() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-28 text-center md:pb-32">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.titanBanner}
            alt=""
            fill
            className="object-cover object-[center_40%]"
            priority
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-[#050a10]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(110,201,240,0.12),_transparent_55%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-white md:text-base md:tracking-[0.32em]">
            Titan Imaging Service
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
            GE PET/CT repair, service, buy &amp; sell
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-text-secondary md:text-xl">
            Precision support for hospitals and imaging centers—built on three decades of hands-on
            GE expertise.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <LinkButton href="/inventory" size="lg">
              Browse Inventory
            </LinkButton>
            <LinkButton href="/contact" variant="secondary" size="lg">
              Request Support
            </LinkButton>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block"
          aria-hidden
        >
          <div className="h-8 w-px bg-gradient-to-b from-accent-ice/60 to-transparent" />
        </div>
      </section>

      {/* Trust + brand strip */}
      <section
        id="trust"
        className="relative border-y border-accent-ice/10 bg-gradient-to-b from-[#0a1218] to-background-raised"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-ice/40 to-transparent" />

        <div className="mx-auto max-w-6xl px-6 py-10 md:px-12 md:py-12">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted">
            Built around the platforms hospitals trust
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:gap-x-14">
            <GeHealthcareMark />
            <span className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
            <PetCtMark />
            <span className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
            <TitanMark size="trust" />
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map(({ Icon, label, detail }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-[#060a10]/55 px-6 py-7 text-left transition hover:border-accent-ice/30"
              >
                <span
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-accent-ice/20 bg-accent-ice/5 text-accent-ice"
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <p className="text-base font-semibold leading-snug text-white">{label}</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter — Better Stack–style center capture */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background-raised via-[#070b10] to-[#071018] py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(110,201,240,0.08),_transparent_65%)]"
          aria-hidden
        />
        <div className="relative px-6 md:px-12">
          <NewsletterCapture />
        </div>
      </section>

      {/* Capability chapters */}
      {CAPABILITIES.map((cap) => (
        <section
          key={cap.title}
          className={cn("relative overflow-hidden py-20 md:py-28", sectionTone(cap.tone))}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(110,201,240,0.04),_transparent_70%)]"
            aria-hidden
          />
          <div
            className={cn(
              "relative mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-12 md:gap-12 md:px-12",
              cap.reverse && "md:[&>*:first-child]:order-2",
            )}
          >
            <div className="md:col-span-5">
              <Eyebrow className="text-accent-ice">{cap.eyebrow}</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                {cap.title}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-text-secondary md:text-lg">
                {cap.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href={cap.cta.href} size="md">
                  {cap.cta.label}
                </LinkButton>
                {"secondaryCta" in cap && cap.secondaryCta ? (
                  <LinkButton href={cap.secondaryCta.href} variant="secondary" size="md">
                    {cap.secondaryCta.label}
                  </LinkButton>
                ) : null}
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm shadow-[0_0_60px_-20px_rgba(110,201,240,0.25)] md:aspect-[16/9]">
                <Image
                  src={cap.image}
                  alt={cap.imageAlt}
                  fill
                  className={cn("object-cover", cap.imagePosition)}
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a10]/50 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Why Titan → Parts Inventory: continuous navy wash (no hard black break) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#080d14] via-[#0a1218] to-[#0c1520] pt-20 md:pt-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(110,201,240,0.08),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 md:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="text-accent-ice">Why Titan</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Built on decades of GE PET/CT mastery
            </h2>
            <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
              Our owner spent years as a Regional PET/CT Zone Support Engineer at GE Healthcare—
              training field engineers, running system audits, and overseeing major installations.
              That rigor now backs every repair, parts order, and system transaction.
            </p>
          </div>

          <dl className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              ["100+", "System audits completed"],
              ["25+", "States served"],
              ["800+", "Facilities supported"],
            ].map(([stat, label]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-[#060a10]/60 px-4 py-6 text-center backdrop-blur-sm"
              >
                <dt className="font-display text-3xl font-bold tracking-wide text-accent-ice md:text-4xl">
                  {stat}
                </dt>
                <dd className="mt-2 text-sm text-text-muted">{label}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 text-center">
            <LinkButton href="/about" variant="secondary" size="md">
              About us
            </LinkButton>
          </div>
        </div>

        {/* Soft bridge into Find a part */}
        <div className="relative mt-20 bg-gradient-to-b from-transparent via-[#091018]/80 to-[#070c12] pb-20 pt-16 md:mt-24 md:pb-24 md:pt-20">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-ice/25 to-transparent"
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center md:px-12">
            <Eyebrow className="text-accent-ice">Parts inventory</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Find a part</h2>
            <p className="mt-4 text-text-secondary">
              Search by part number or name—OEM and refurbished CT/PET components.
            </p>
            <HomeSearch />
          </div>
        </div>
      </section>

      {/* Insights strip */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#070c12] to-background-raised py-16 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center md:px-12">
          <div className="max-w-xl">
            <Eyebrow className="text-accent-ice">Industry insight</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              Guides for CT installation, PET/CT, and equipment transitions
            </h2>
          </div>
          <Link
            href="/insights"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent-ice transition hover:gap-3 hover:text-white"
          >
            Read insights
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background-raised via-[#0a1016] to-[#05080c] py-20 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(110,201,240,0.09),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-6 text-center md:px-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Talk to a specialist</h2>
          <p className="mt-4 text-lg text-text-secondary">
            Need service, a quote on a system, or help sourcing a part? Reach the team directly.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <LinkButton href="/contact" size="lg">
              Contact us
            </LinkButton>
            <LinkButton href="/book" variant="secondary" size="lg">
              Book a call
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
