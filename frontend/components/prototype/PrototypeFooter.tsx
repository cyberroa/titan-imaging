import Link from "next/link";
import { PROTO_NAV_MORE, PROTO_NAV_PRIMARY } from "@/lib/prototype-nav";

function GoogleGLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const FOOTER_LINKS = [
  ...PROTO_NAV_PRIMARY,
  { href: "/contact", label: "Contact" },
  ...PROTO_NAV_MORE,
] as const;

export function PrototypeFooter() {
  return (
    <footer className="mt-0 border-t border-white/10 bg-background-raised">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr] md:px-12 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">
            Titan Imaging Service
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
            Repair, service, parts, and buy/sell support for GE PET/CT systems—built on 30+ years of
            hands-on imaging expertise.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.slice(0, 5).map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-text-secondary transition hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Company</p>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LINKS.slice(5).map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-text-secondary transition hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/" className="text-sm text-text-muted transition hover:text-white">
                Current site home
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-text-muted md:flex-row md:px-12">
          <p>© {new Date().getFullYear()} TITAN IMAGING. All Rights Reserved.</p>
          <Link
            href="/admin/login"
            aria-label="Google Login — staff sign in"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-white/20 hover:text-white"
          >
            <GoogleGLogo className="shrink-0" />
            <span>Staff login</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
