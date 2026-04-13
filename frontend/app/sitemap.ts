import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const ROUTES: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[0]["changeFrequency"]>;
  priority: number;
}[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/about", changeFrequency: "monthly", priority: 0.85 },
    { path: "/services", changeFrequency: "monthly", priority: 0.9 },
    { path: "/inventory", changeFrequency: "weekly", priority: 0.95 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.85 },
    { path: "/book", changeFrequency: "monthly", priority: 0.8 },
    { path: "/sell", changeFrequency: "monthly", priority: 0.8 },
    { path: "/insights", changeFrequency: "monthly", priority: 0.8 },
    { path: "/testimonials", changeFrequency: "monthly", priority: 0.65 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
