/** Public Cal.com event or profile URL (no secrets). Set per environment. */
export function getCalComEmbedUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_CAL_COM_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.searchParams.set("embed", "true");
    url.searchParams.set("theme", "dark");
    url.searchParams.set("ui.color-scheme", "dark");
    return url.href;
  } catch {
    return null;
  }
}
