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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries when failure looks transient (cold start, network blip, 5xx). Skips retry on typical 4xx. */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 429 || error.status === 408;
  }
  return true;
}

export type WithRetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attemptIndex: number) => boolean;
};

export async function withRetry<T>(fn: () => Promise<T>, options?: WithRetryOptions): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  const shouldRetry = options?.shouldRetry ?? ((err) => defaultShouldRetry(err));

  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const canRetry = i < attempts - 1 && shouldRetry(e, i);
      if (!canRetry) {
        throw e;
      }
      await sleep(baseDelayMs * (i + 1));
    }
  }
  throw last;
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
