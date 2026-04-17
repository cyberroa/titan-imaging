import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === "/admin/login";

  if (pathname.startsWith("/admin") && !isAdminLogin) {
    if (!user) {
      const u = new URL("/admin/login", request.url);
      return NextResponse.redirect(u);
    }
    const allow = process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST || "";
    if (allow.trim()) {
      const allowed = new Set(
        allow
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
      const email = user.email?.toLowerCase();
      if (!email || !allowed.has(email)) {
        return NextResponse.redirect(new URL("/admin/login?error=forbidden", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/callback"],
};
