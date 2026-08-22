"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TitanMark } from "@/components/prototype/BrandMarks";
import { cn } from "@/lib/cn";
import { PROTO_NAV_MORE, PROTO_NAV_PRIMARY } from "@/lib/prototype-nav";

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "whitespace-nowrap py-2 text-sm font-semibold transition hover:text-white xl:py-0",
        active ? "text-white" : "text-text-secondary",
        className,
      )}
    >
      {label}
    </Link>
  );
}

export function PrototypeHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close "More" when resizing into the full-link breakpoint
  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1280px)").matches) {
        setMoreOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
        // No border-b — avoids a fixed 1px “seam” that tracks while scrolling
        scrolled || open
          ? "bg-background-raised/95 shadow-[0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md"
          : "bg-black/30 shadow-none backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6 md:px-10 md:py-4 lg:px-12">
        <Link
          href="/prototype"
          className="flex min-w-0 shrink items-center py-1"
          onClick={() => setOpen(false)}
          aria-label="Titan Imaging Service — home"
        >
          <TitanMark size="nav" />
        </Link>

        {/* Mobile hamburger — below md */}
        <button
          type="button"
          className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cn(
              "block h-0.5 w-5 origin-center bg-white transition",
              open && "translate-y-[7px] rotate-45",
            )}
          />
          <span className={cn("block h-0.5 w-5 bg-white transition", open && "opacity-0")} />
          <span
            className={cn(
              "block h-0.5 w-5 origin-center bg-white transition",
              open && "-translate-y-[7px] -rotate-45",
            )}
          />
        </button>

        {/*
          Breakpoints:
          - xl+: all links expanded
          - md–xl: primary + “More” dropdown
          - < md: hamburger panel
        */}
        <nav
          className={cn(
            open ? "flex" : "hidden",
            "w-full basis-full flex-col gap-1 md:flex md:w-auto md:basis-auto md:flex-row md:items-center md:gap-5 lg:gap-6 xl:gap-7",
          )}
        >
          {PROTO_NAV_PRIMARY.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          ))}

          {/* Expanded secondary links — xl and up */}
          {PROTO_NAV_MORE.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
              className="hidden xl:inline-flex"
            />
          ))}

          {/* “More” — md to xl only */}
          <div className="relative hidden md:block xl:hidden">
            <button
              type="button"
              className="py-0 text-sm font-semibold text-text-secondary transition hover:text-white"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
            </button>
            {moreOpen ? (
              <div className="absolute right-0 top-full mt-3 min-w-[11rem] rounded-lg border border-white/10 bg-background-raised py-2 shadow-xl">
                {PROTO_NAV_MORE.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block px-4 py-2 text-sm text-text-secondary transition hover:bg-white/5 hover:text-white"
                    onClick={() => setMoreOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* Secondary links inside mobile hamburger panel */}
          <div className="flex flex-col gap-1 border-t border-white/10 pt-2 md:hidden">
            {PROTO_NAV_MORE.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>

          <div className="pt-2 md:pt-0">
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-accent-ice px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 md:w-auto"
            >
              Contact
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
