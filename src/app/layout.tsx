import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { config } from "@/lib/config";
import { getSession } from "@/lib/auth/current-user";
import { getDict } from "@/lib/i18n/server";
import { navFor } from "@/components/layout/nav";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

export const metadata: Metadata = {
  title: "Bhopal Tatkal — the City's Complaint Queue",
  description:
    "Report a civic problem in Bhopal. AI-assisted triage, authority verification and transparent resolution tracking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a6b5a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, { lang, t }] = await Promise.all([getSession(), getDict()]);
  const nav = navFor(session?.role ?? null);

  return (
    <html lang={lang === "hi" ? "hi" : "en"}>
      <body className="min-h-screen pb-20 sm:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2"
        >
          Skip to content
        </a>

        {config.demoMode && (
          <div className="bg-amber-50 px-4 py-1.5 text-center text-sm text-amber-900">
            🧪 {t.demoBanner}{" "}
            <Link href="/login" className="font-semibold underline">
              Switch demo role
            </Link>
          </div>
        )}

        {/* Header */}
        <header className="border-b border-line bg-surface/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-extrabold text-civic-700 tracking-tight"
            >
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-600 text-white text-sm font-black"
              >
                BT
              </span>
              Bhopal Tatkal
            </Link>

            <div className="flex items-center gap-3">
              <LanguageToggle current={lang} />
              {session ? (
                <Link
                  href="/my-issues"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink hover:bg-civic-50"
                >
                  My Issues
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink hover:bg-civic-50"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>

          {/* Desktop nav pills */}
          <nav
            aria-label="Main"
            className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:flex"
          >
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted hover:bg-civic-50 hover:text-civic-700 font-medium"
              >
                <span aria-hidden>{n.icon} </span>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main id="main">{children}</main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface sm:hidden"
        >
          {nav.slice(0, 5).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex min-h-16 flex-col items-center justify-center text-xs text-muted gap-0.5"
            >
              <span aria-hidden className="text-xl">
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
