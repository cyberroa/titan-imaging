import type { Metadata } from "next";
import { Suspense } from "react";
import { InventoryBrowser } from "@/components/InventoryBrowser";

export const metadata: Metadata = {
  title: "Parts Inventory",
  description:
    "Search CT/PET parts and components by number or category. Call (904) 742-6265 to confirm availability.",
  openGraph: {
    title: "Parts Inventory | TITAN IMAGING",
    description:
      "Search CT/PET parts and components by number or category. Call (904) 742-6265 to confirm availability.",
    url: "/inventory",
  },
  alternates: {
    canonical: "/inventory",
  },
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] animate-pulse bg-gradient-to-b from-background-muted to-black" />
      }
    >
      <InventoryBrowser initialSearch={q ?? ""} />
    </Suspense>
  );
}
