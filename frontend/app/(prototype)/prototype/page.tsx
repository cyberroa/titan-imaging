import type { Metadata } from "next";
import { PrototypeHome } from "@/components/prototype/PrototypeHome";

export const metadata: Metadata = {
  title: "Layout Prototype",
  description:
    "Local-only layout prototype for Titan Imaging Service — GE PET/CT repair, service, buy and sell.",
  robots: { index: false, follow: false },
};

export default function PrototypePage() {
  return <PrototypeHome />;
}
