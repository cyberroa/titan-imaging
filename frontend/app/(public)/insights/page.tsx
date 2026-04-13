import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Industry Insight",
  description:
    "Resources on CT/PET installation, equipment sales, and imaging best practices.",
  openGraph: {
    title: "Industry Insight | TITAN IMAGING",
    description:
      "Resources on CT/PET installation, equipment sales, and imaging best practices.",
    url: "/insights",
  },
  alternates: {
    canonical: "/insights",
  },
};

type InsightPost = {
  featured: boolean;
  image: string;
  imageAlt: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  soon: boolean;
  href?: string;
  cta?: string;
};

const posts: InsightPost[] = [
  {
    featured: true,
    image: IMAGES.servicesImage,
    imageAlt: "CT scanner and medical imaging technology",
    category: "Installation",
    date: "2026",
    title: "How Much Does CT Scanner Installation Cost in 2026?",
    excerpt:
      "Understand the full scope of CT installation costs—including site preparation, rigging, compliance, and technical calibration requirements.",
    href: "#",
    cta: "Read Article →",
    soon: false,
  },
  {
    featured: false,
    image: IMAGES.aboutTitant,
    imageAlt: "Technician working on PET/CT system",
    category: "De-Installation",
    date: "—",
    title: "Complete Guide to Deinstalling a PET CT System Safely",
    excerpt:
      "A step-by-step breakdown of safe PET CT system removal, transportation logistics, and regulatory considerations for facilities.",
    soon: true,
  },
  {
    featured: false,
    image: IMAGES.scan,
    imageAlt: "CT/PET imaging scan",
    category: "Selling",
    date: "—",
    title: "How to Sell a Used CT Scanner",
    excerpt:
      "Learn how imaging centers can maximize value when selling used CT systems while minimizing downtime and risk.",
    soon: true,
  },
];

export default function InsightsPage() {
  return (
    <>
      <section className="relative flex min-h-[42vh] flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-4 text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.aboutUs}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="font-display text-[11px] uppercase tracking-[0.25em] text-accent-titanium">
            The Blog
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-5xl">Industry Insight</h1>
          <p className="mt-4 text-text-secondary">
            Stay informed with in-depth resources on imaging equipment, best practices,
            and industry trends—built from decades of hands-on experience.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.title}
              className={`overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] transition hover:-translate-y-1 hover:border-white/20 ${
                post.featured ? "md:col-span-2 md:grid md:grid-cols-2" : ""
              }`}
            >
              <div className="relative h-48 md:h-full md:min-h-[220px]">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-display uppercase tracking-widest text-accent-titanium">
                    {post.category}
                  </span>
                  <span className="text-text-muted">{post.date}</span>
                {post.soon ? (
                  <span className="ml-auto rounded bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                    Coming Soon
                  </span>
                ) : null}
                </div>
                <h2 className="text-lg font-semibold leading-snug">{post.title}</h2>
                <p className="mt-3 flex-1 text-sm text-text-muted">{post.excerpt}</p>
                {post.soon ? (
                  <span className="mt-4 text-sm font-semibold text-text-muted">
                    Coming Soon
                  </span>
                ) : post.href ? (
                  <Link
                    href={post.href}
                    className="mt-4 inline-flex text-sm font-semibold text-accent-titanium hover:underline"
                  >
                    {post.cta ?? "Read more →"}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-text-muted">
          Full article pages can be added when content is ready.{" "}
          <Link href="/contact" className="text-accent-titanium underline">
            Contact us
          </Link>{" "}
          for questions.
        </p>
      </div>
    </>
  );
}
