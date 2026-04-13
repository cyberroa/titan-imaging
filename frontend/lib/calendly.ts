export const CALENDLY_EMBED_URL =
  "https://calendly.com/titanimagingservice?primary_color=A9B4C2&text_color=FFFFFF&background_color=081832";

/** Inline iframe embed — Calendly requires embed_domain + embed_type for the iframe to load. */
export function getCalendlyInlineIframeSrc(host: string): string {
  const url = new URL(CALENDLY_EMBED_URL);
  url.searchParams.set("embed_domain", host);
  url.searchParams.set("embed_type", "Inline");
  return url.href;
}
