import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SellForm } from "@/components/forms/SellForm";

export const metadata: Metadata = {
  title: "Sell to Us",
  description:
    "Sell PET/CT equipment and parts to Titan Imaging Service—fair quotes and a simple process.",
  openGraph: {
    title: "Sell to Us | TITAN IMAGING",
    description:
      "Sell PET/CT equipment and parts to Titan Imaging Service—fair quotes and a simple process.",
    url: "/sell",
  },
  alternates: {
    canonical: "/sell",
  },
};

export default function SellPage() {
  return (
    <>
      <section className="relative flex min-h-[42vh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-4 text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/selltous.png"
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
            Sell Your Equipment
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Sell With Confidence</h1>
          <p className="mt-4 text-text-secondary">
            Turn your PET/CT equipment into a fair offer. We buy systems, parts, and
            components—and make the process simple.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-white/10 bg-[#0d0d0d]/95 p-8">
          <div className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-[0.15em] text-accent-titanium">
              Submit Your Equipment
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Fill out the form and we&apos;ll follow up with a quote (API in Phase 2).
            </p>
          </div>
          <SellForm />
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d0d0d]/95 p-8">
          <h2 className="font-display text-sm uppercase tracking-[0.15em] text-accent-titanium">
            How It Works
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Selling your equipment to Titan Imaging is simple and secure. Submit your
            details, receive a fair quote, and we guide you through every step for a
            smooth, transparent experience.
          </p>
          <ol className="mt-8 space-y-6 border-t border-white/10 pt-8">
            {[
              ["Submit", "Send equipment details via the form. Include model, condition, and quantity."],
              ["Get a Quote", "Our team reviews your submission and provides a fair offer within 24 hours."],
              ["Complete", "We handle logistics and payment so you can sell with confidence."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-titanium/10 font-display text-sm font-bold text-accent-titanium">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            {["CT Systems", "PET Systems", "Parts & Components"].map((label) => (
              <div
                key={label}
                className="flex min-w-[120px] flex-1 flex-col items-center rounded-lg border border-white/10 bg-accent-titanium/5 py-4 text-center"
              >
                <span className="text-lg text-accent-titanium" aria-hidden>
                  ◇
                </span>
                <span className="mt-2 text-xs font-semibold text-text-secondary">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 rounded-lg border border-accent-titanium/15 bg-accent-titanium/5 px-4 py-3 text-center text-sm text-text-secondary">
            Prefer to talk? Call{" "}
            <Link href="tel:9047426265" className="font-semibold text-accent-titanium">
              (904) 742-6265
            </Link>
            .
          </p>
          <p className="mt-6 border-t border-white/10 pt-6 text-xs leading-relaxed text-text-muted">
            <strong className="text-text-secondary">Security note:</strong> verify
            communications by calling{" "}
            <a href="tel:9047426265" className="text-accent-titanium underline">
              (904) 742-6265
            </a>{" "}
            or{" "}
            <a href="mailto:info@test.com" className="text-accent-titanium underline">
              info@test.com
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
