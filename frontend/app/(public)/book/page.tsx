import type { Metadata } from "next";
import Image from "next/image";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Schedule time with Titan Imaging Service via Calendly.",
  openGraph: {
    title: "Book an Appointment | TITAN IMAGING",
    description: "Schedule time with Titan Imaging Service via Calendly.",
    url: "/book",
  },
  alternates: {
    canonical: "/book",
  },
};

export default function BookPage() {
  return (
    <section className="relative overflow-visible pb-16 md:pb-20">
      {/* Image + overlays only fill the upper banner; bottom fades to page black */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(52vh,600px)] overflow-hidden"
        aria-hidden
      >
        <Image
          src={IMAGES.servicesImage}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black from-[12%] via-black/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-12 text-center md:pt-16">
        <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
          Scheduling
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Book an Appointment</h1>
        <p className="mx-auto mt-4 max-w-xl text-text-secondary">
          Choose a time that works for you. Calendly will be swapped for Cal.com in a later phase if
          you choose to migrate.
        </p>
      </div>

      {/* ~1in (96px) below the title block; sits in the fade / on black */}
      <div className="relative z-20 mx-auto mt-24 max-w-4xl px-6">
        <div className="overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10">
          <CalendlyEmbed />
        </div>
      </div>
    </section>
  );
}
