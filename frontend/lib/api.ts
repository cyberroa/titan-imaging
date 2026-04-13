export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    // Local dev default (FastAPI): keep frontend usable without env setup.
    return "http://localhost:8000";
  }
  return raw.replace(/\/+$/, "");
}

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new ApiError(`API request failed (${res.status})`, res.status, body);
  }

  return (await res.json()) as T;
}

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ApiPart = {
  id: string;
  part_number: string;
  name: string;
  description?: string | null;
  category?: string | null;
  stock_quantity: number;
  status: string;
  price?: number | null;
};
