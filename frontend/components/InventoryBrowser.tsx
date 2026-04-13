"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IMAGES } from "@/lib/images";
import { MOCK_PARTS, type PartRow } from "@/lib/inventory-mock";

type Filter = "all" | "in-stock" | "CT" | "PET" | "General";

function filterParts(
  parts: PartRow[],
  search: string,
  filter: Filter,
): PartRow[] {
  const q = search.trim().toLowerCase();
  return parts.filter((p) => {
    const matchSearch =
      !q ||
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q);
    const matchFilter =
      filter === "all"
        ? true
        : filter === "in-stock"
          ? p.stock > 0
          : p.category === filter;
    return matchSearch && matchFilter;
  });
}

export function InventoryBrowser({ initialSearch = "" }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const filtered = useMemo(
    () => filterParts(MOCK_PARTS, search, filter),
    [search, filter],
  );

  const pills: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "in-stock", label: "In Stock" },
    { key: "CT", label: "CT" },
    { key: "PET", label: "PET" },
    { key: "General", label: "General" },
  ];

  return (
    <>
      <section className="relative flex min-h-[380px] flex-col items-center justify-end overflow-hidden px-6 pb-10 pt-4 text-center md:min-h-[420px] md:pb-14">
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={IMAGES.inventoryBanner}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black" />
        </div>

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-accent-titanium">
            Live Inventory
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">We Have What You Need</h1>
          <p className="mx-auto mt-3 max-w-lg text-text-secondary">
            Search by part number or name. Call{" "}
            <a
              href="tel:9047426265"
              className="font-semibold text-white underline-offset-2 hover:text-accent-titanium hover:underline"
            >
              (904) 742-6265
            </a>{" "}
            to speak with someone directly.
          </p>

          <div className="relative z-20 mt-8 w-full max-w-xl">
            <div className="flex overflow-hidden rounded-lg border border-white/10 bg-background-raised/95 shadow-lg shadow-black/40">
              <input
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base text-white outline-none placeholder:text-text-muted"
                placeholder="Search part number or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="bg-accent-titanium px-6 py-3.5 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Search
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {pills.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    filter === key
                      ? "border-accent-titanium bg-accent-titanium text-black"
                      : "border-white/15 text-text-muted hover:border-white/25 hover:text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-12 max-w-5xl px-6 pb-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-muted">Available Parts</h2>
          <span className="text-sm text-text-muted">
            {filtered.length} part{filtered.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-background-card py-16 text-center">
            <p className="text-text-muted">
              No parts match your search.{" "}
              <Link href="/contact" className="font-semibold text-accent-titanium underline">
                Contact us
              </Link>
              —we may be able to source what you need.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const inStock = p.stock > 0;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-[#0d0d0d] p-6 transition hover:border-white/20"
                >
                  <p className="font-display text-xs tracking-wider text-accent-titanium">
                    {p.id}
                  </p>
                  <p className="mt-2 text-base font-semibold leading-snug">{p.name}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                      {p.category}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        inStock
                          ? "bg-accent-titanium/15 text-accent-titanium"
                          : "bg-white/5 text-text-muted"
                      }`}
                    >
                      {inStock ? `${p.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
