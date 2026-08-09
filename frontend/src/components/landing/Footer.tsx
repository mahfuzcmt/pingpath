"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

const CONTACT = {
  hotline: "+880 1629-563645",
  email: "hello@motolink.com.bd",
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="logoGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <path d="M24 6L42 40C42 42 40 44 38 44H10C8 44 6 42 6 40L24 6Z" fill="url(#logoGradFooter)" />
        <path d="M12 34C15 31 20 29 25 33" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M16 28C19 25 24 24 29 27" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
        <circle cx="14" cy="37" r="2" fill="white" opacity="0.9" />
        <circle cx="21" cy="34" r="1.5" fill="white" opacity="0.8" />
        <circle cx="28" cy="31" r="1.5" fill="white" opacity="0.7" />
      </svg>
      <div>
        <div className="text-xl font-extrabold leading-tight tracking-tight text-white">MOTOLINK</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">GPS Tracking</div>
      </div>
    </div>
  );
}

function Icon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
};

const NAV_LINKS = [
  { key: "nav.home", href: "/" },
  { key: "nav.features", href: "/features" },
  { key: "nav.products", href: "/products" },
  { key: "nav.solutions", href: "/solutions" },
  { key: "nav.pricing", href: "/pricing" },
  { key: "nav.contact", href: "/contact" },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-gray-800 bg-gray-900 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-gray-400">
              {t("footer.desc")}
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { label: "Facebook", href: "https://facebook.com/motolinkgps" },
                { label: "LinkedIn", href: "https://linkedin.com/company/motolinkgps" },
                { label: "YouTube", href: "https://youtube.com/@motolinkgps" },
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-sm font-semibold text-gray-400 transition-colors hover:bg-teal-600 hover:text-white"
                >
                  {s.label[0]}
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-400">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3 text-[14px]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 transition-colors hover:text-teal-400">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-gray-400 transition-colors hover:text-teal-400">
                  {t("nav.signIn")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-400">{t("footer.contactUs")}</h4>
            <ul className="space-y-3 text-[14px] text-gray-400">
              <li className="flex items-center gap-2">
                <Icon path={ICONS.phone} className="h-4 w-4 text-teal-500" />
                <a href={`tel:${CONTACT.hotline.replace(/[^+\d]/g, "")}`} className="hover:text-teal-400">{CONTACT.hotline}</a>
              </li>
              <li className="flex items-center gap-2">
                <Icon path={ICONS.mail} className="h-4 w-4 text-teal-500" />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-teal-400">{CONTACT.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <Icon path={ICONS.map} className="mt-0.5 h-4 w-4 text-teal-500" />
                <span>{t("footer.address")}</span>
              </li>
            </ul>
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t("footer.certifications")}</div>
              <div className="mt-2 flex gap-2">
                {["BTRC", "ISO 9001"].map((c) => (
                  <div key={c} className="rounded-md bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400">{c}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
          <span className="text-sm text-gray-500">© {new Date().getFullYear()} MotoLink GPS. {t("footer.rights")}</span>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-teal-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-teal-400">Terms of Service</Link>
            <span>Made with ❤️ in Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
