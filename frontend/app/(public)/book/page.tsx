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
    <>
      <section className="relative min-h-[40vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.servicesImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
          <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
            Scheduling
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Book an Appointment</h1>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Choose a time that works for you. Calendly will be swapped for Cal.com in a
            later phase if you choose to migrate.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-24">
        <CalendlyEmbed />
      </div>
    </>
  );
}
