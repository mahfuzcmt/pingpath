"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { MotoLinkLogoInline } from "./MotoLinkLogo";

const NAV_LINKS = [
  { href: "/features", key: "mkt.nav.features" },
  { href: "/industries", key: "mkt.nav.industries" },
  { href: "/pricing", key: "mkt.nav.pricing" },
  { href: "/about", key: "mkt.nav.about" },
  { href: "/contact", key: "mkt.nav.contact" },
] as const;

export function MarketingHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { t } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = variant === "dark";
  const linkClass = isDark ? "mkt-nav-link-dark" : "mkt-nav-link";

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md ${isDark ? "bg-[#0A1928]/90" : "bg-white/90 border-b border-surface-200"}`}>
      <div className="mkt-container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <MotoLinkLogoInline />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <LanguageToggle className={isDark ? "!text-ink-300 hover:!text-white hover:!bg-white/10" : ""} />

          <Link href="/login" className="hidden md:block">
            <button className={`mkt-btn-ghost ${isDark ? "!text-ink-300 hover:!text-white hover:!bg-white/10" : ""}`}>
              {t("mkt.nav.login")}
            </button>
          </Link>

          <Link href="/contact" className="hidden md:block">
            <button className="mkt-btn-primary">
              {t("mkt.nav.getStarted")}
            </button>
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden ${isDark ? "text-white hover:bg-white/10" : "text-ink-700 hover:bg-surface-100"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={`border-t md:hidden ${isDark ? "border-white/10 bg-[#0A1928]" : "border-surface-200 bg-white"}`}>
          <nav className="mkt-container flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-4 py-3 text-base font-medium ${isDark ? "text-ink-300 hover:bg-white/10 hover:text-white" : "text-ink-700 hover:bg-surface-100 hover:text-ink-900"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
            <hr className={`my-2 ${isDark ? "border-white/10" : "border-surface-200"}`} />
            <Link
              href="/login"
              className={`rounded-md px-4 py-3 text-base font-medium ${isDark ? "text-ink-300 hover:bg-white/10 hover:text-white" : "text-ink-700 hover:bg-surface-100 hover:text-ink-900"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("mkt.nav.login")}
            </Link>
            <Link href="/contact" className="mt-2" onClick={() => setMobileMenuOpen(false)}>
              <button className="mkt-btn-primary w-full">
                {t("mkt.nav.getStarted")}
              </button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
