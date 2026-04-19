import type { Metadata } from "next";
import Image from "next/image";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What imaging centers say about Titan Imaging Service—customer stories and references.",
  openGraph: {
    title: "Testimonials | TITAN IMAGING",
    description:
      "What imaging centers say about Titan Imaging Service—customer stories and references.",
    url: "/testimonials",
  },
  alternates: {
    canonical: "/testimonials",
  },
};

const PLACEHOLDER = [
  {
    quote:
      "Placeholder testimonial — customer stories will be added here or pulled from the CMS in a later phase.",
    author: "Imaging Director",
    org: "Southeast Hospital Network",
  },
  {
    quote:
      "Placeholder — Titan Imaging’s responsiveness and technical depth made our PET/CT upgrade seamless.",
    author: "Lead Physicist",
    org: "Regional Imaging Center",
  },
  {
    quote: "Placeholder — From parts sourcing to on-site support, the team delivers every time.",
    author: "Operations Manager",
    org: "Multi-Site Imaging Group",
  },
];

export default function TestimonialsPage() {
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
            Social Proof
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Testimonials</h1>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            Real quotes from customers will replace these placeholders when you&apos;re ready to
            publish them.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-24 pt-14">
        <div className="grid gap-8 md:grid-cols-3">
          {PLACEHOLDER.map((t) => (
            <blockquote
              key={t.author}
              className="flex flex-col rounded-xl border border-white/10 bg-background-card p-8"
            >
              <p className="flex-1 text-sm italic leading-relaxed text-text-secondary">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-white/10 pt-4">
                <p className="font-semibold text-white">{t.author}</p>
                <p className="text-xs text-text-muted">{t.org}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </>
  );
}
