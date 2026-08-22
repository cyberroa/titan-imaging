import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";

const sizeClasses = {
  standard: {
    section:
      "relative flex min-h-[45vh] flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-4 text-center",
    gradient: "from-black/45 via-black/75 to-black",
    title: "mt-3 text-3xl font-bold md:text-5xl",
    subtitle: "mx-auto mt-4 max-w-2xl text-lg text-text-secondary",
  },
  home: {
    section:
      "relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-5 pb-28 pt-6 text-center md:min-h-[90vh] md:pb-40",
    gradient: "from-black/40 via-black/70 to-black",
    title: "mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl",
    subtitle: "mx-auto mt-6 max-w-xl text-lg text-text-secondary md:text-xl",
  },
  compact: {
    section:
      "relative flex min-h-[380px] flex-col items-center justify-end overflow-hidden px-6 pb-10 pt-4 text-center md:min-h-[420px] md:pb-14",
    gradient: "from-black/50 via-black/70 to-black",
    title: "mt-2 text-3xl font-bold md:text-4xl",
    subtitle: "mx-auto mt-3 max-w-lg text-text-secondary",
  },
} as const;

type PageHeroSize = keyof typeof sizeClasses;

type PageHeroProps = {
  image: StaticImageData | string;
  imageAlt?: string;
  size?: PageHeroSize;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  contentClassName?: string;
  priority?: boolean;
};

export function PageHero({
  image,
  imageAlt = "",
  size = "standard",
  eyebrow,
  title,
  subtitle,
  children,
  contentClassName,
  priority = true,
}: PageHeroProps) {
  const styles = sizeClasses[size];

  return (
    <section className={styles.section}>
      <div className="absolute inset-0 z-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          priority={priority}
          sizes="100vw"
        />
        <div
          className={cn("absolute inset-0 bg-gradient-to-b", styles.gradient, "to-black")}
        />
      </div>
      <div className={cn("relative z-10 max-w-3xl", contentClassName)}>
        {eyebrow ? (
          typeof eyebrow === "string" ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow
        ) : null}
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
