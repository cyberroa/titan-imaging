"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/nav";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-background-raised shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-12">
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="Titan Imaging Service"
            width={220}
            height={52}
            className="h-9 w-auto max-w-[200px] object-contain md:h-10 md:max-w-[240px]"
            priority
          />
        </Link>

        <button
          type="button"
          className="flex flex-col gap-1.5 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="h-0.5 w-6 bg-white transition" />
          <span className="h-0.5 w-6 bg-white transition" />
          <span className="h-0.5 w-6 bg-white transition" />
        </button>

        <nav
          className={`${
            open ? "flex" : "hidden"
          } w-full basis-full flex-col gap-1 md:flex md:w-auto md:basis-auto md:flex-row md:items-center md:gap-6`}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`whitespace-nowrap py-2 text-sm font-semibold transition hover:text-accent-titanium md:py-0 ${
                  active ? "text-accent-titanium" : "text-text-secondary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
