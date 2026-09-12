import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

/** Same-origin ingest so blockers are less likely to drop public activity. */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const url = `${getApiBaseUrl()}/api/v1/activity`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return new NextResponse(null, { status: res.ok ? 204 : res.status });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
