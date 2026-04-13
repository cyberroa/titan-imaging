/**
 * Canonical site URL for SEO (metadataBase, sitemap, JSON-LD).
 * Set `NEXT_PUBLIC_SITE_URL` on Vercel to your production domain, e.g. https://www.example.com
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}
