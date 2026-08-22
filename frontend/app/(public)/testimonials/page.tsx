import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
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
      "Placeholder — Titan Imaging's responsiveness and technical depth made our PET/CT upgrade seamless.",
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
      <PageHero
        image={IMAGES.customerService}
        eyebrow="Social Proof"
        title="Testimonials"
        subtitle="Real quotes from customers will replace these placeholders when you're ready to publish them."
        contentClassName="max-w-2xl"
      />

      <Section spacing="none" className="pb-24 pt-14">
        <Container maxWidth="wide">
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
        </Container>
      </Section>
    </>
  );
}
