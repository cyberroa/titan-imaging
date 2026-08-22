import Image from "next/image";
import { HomeSearch } from "@/components/HomeSearch";
import { GeHealthcareMark, PetCtMark, TitanMark } from "@/components/prototype/BrandMarks";
import { CapabilityCarousel } from "@/components/prototype/CapabilityCarousel";
import { FadeRule } from "@/components/prototype/FadeRule";
import { InsightsCarousel } from "@/components/prototype/InsightsCarousel";
import { NewsletterCapture } from "@/components/prototype/NewsletterCapture";
import { TrustTileCarousel } from "@/components/prototype/TrustTileCarousel";
import { Eyebrow, LinkButton } from "@/components/ui";
import { IMAGES } from "@/lib/images";

export function PrototypeHome() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-28 text-center md:pb-32">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.prototypeHero}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            quality={95}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(110,201,240,0.1),_transparent_55%)]" />
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
      <section id="trust" className="relative bg-black">
        <FadeRule />
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-12 md:py-14">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-text-muted">
            Built around the platforms hospitals trust
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:gap-x-14">
            <GeHealthcareMark />
            <span
              className="hidden h-5 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block"
              aria-hidden
            />
            <PetCtMark />
            <span
              className="hidden h-5 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block"
              aria-hidden
            />
            <TitanMark size="trust" />
          </div>

          <TrustTileCarousel />
        </div>
        <FadeRule />
      </section>

      {/* Newsletter */}
      <section className="relative overflow-hidden bg-black py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(110,201,240,0.07),_transparent_65%)]"
          aria-hidden
        />
        <div className="relative px-6 md:px-12">
          <NewsletterCapture />
        </div>
        <FadeRule className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Capabilities — one carousel instead of three stacked sections */}
      <div className="bg-black">
        <CapabilityCarousel />
      </div>

      {/* Why Titan */}
      <section className="relative overflow-hidden bg-black py-20 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(110,201,240,0.06),_transparent_50%)]"
          aria-hidden
        />
        <FadeRule className="absolute inset-x-0 top-0" />
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
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-6 text-center"
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
              About Titan
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Parts search */}
      <section className="relative bg-black pb-20 pt-4 md:pb-24">
        <FadeRule />
        <div className="mx-auto max-w-3xl px-6 pt-16 text-center md:px-12 md:pt-20">
          <Eyebrow className="text-accent-ice">Parts inventory</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Find a part</h2>
          <p className="mt-4 text-text-secondary">
            Search by part number or name—OEM and refurbished CT/PET components.
          </p>
          <HomeSearch />
        </div>
      </section>

      {/* Insights */}
      <InsightsCarousel />

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-black py-20 md:py-28">
        <FadeRule />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(110,201,240,0.08),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-6 pt-12 text-center md:px-12 md:pt-14">
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
