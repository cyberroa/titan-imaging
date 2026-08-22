/** Primary nav links — always shown from md up. */
export const PROTO_NAV_PRIMARY = [
  { href: "/inventory", label: "Inventory" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/sell", label: "Sell to Us" },
] as const;

/** Secondary links — expanded at xl+, “More” from md–xl, hamburger below md. */
export const PROTO_NAV_MORE = [
  { href: "/book", label: "Book" },
  { href: "/insights", label: "Industry Insight" },
  { href: "/testimonials", label: "Testimonials" },
] as const;
