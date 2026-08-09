"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

export function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1928] via-[#0E3257] to-[#0A1928]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="mkt-container relative px-4 py-20 md:px-6 md:py-28 lg:py-36">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2">
            <svg className="h-4 w-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-brand-300">
              {t("mkt.hero.badge")}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {t("mkt.hero.headline")}
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-300 md:text-xl">
            {t("mkt.hero.subheadline")}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <button className="mkt-btn-primary min-w-[180px]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {t("mkt.hero.cta.primary")}
              </button>
            </Link>
            <Link href="/features">
              <button className="mkt-btn-white min-w-[180px]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                {t("mkt.hero.cta.secondary")}
              </button>
            </Link>
          </div>

          {/* Feature preview image placeholder */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
              {/* Dashboard mockup */}
              <div className="aspect-video bg-gradient-to-br from-[#0A1928] to-[#0E3257] p-4">
                {/* Fake topbar */}
                <div className="flex h-8 items-center gap-2 rounded-t-lg bg-white/10 px-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-white/60">app.motolink.com.bd</span>
                  </div>
                </div>
                {/* Dashboard content mockup */}
                <div className="mt-2 grid h-[calc(100%-40px)] grid-cols-12 gap-3">
                  {/* Sidebar */}
                  <div className="col-span-2 rounded-lg bg-white/5 p-2">
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-6 rounded ${i === 1 ? "bg-brand-500/50" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>
                  {/* Map area */}
                  <div className="col-span-7 rounded-lg bg-brand-900/30 relative overflow-hidden">
                    {/* Fake map grid */}
                    <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="mapgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#mapgrid)" />
                    </svg>
                    {/* Vehicle markers */}
                    <div className="absolute top-1/4 left-1/3 h-3 w-3 rounded-full bg-status-moving animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 h-3 w-3 rounded-full bg-status-moving animate-pulse" />
                    <div className="absolute top-2/3 left-1/4 h-3 w-3 rounded-full bg-status-idle" />
                    <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-status-stopped" />
                  </div>
                  {/* Side panel */}
                  <div className="col-span-3 rounded-lg bg-white/5 p-2">
                    <div className="mb-2 h-4 w-3/4 rounded bg-white/20" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2 rounded bg-white/10 p-2">
                          <div className="h-6 w-6 rounded bg-brand-500/30" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-3/4 rounded bg-white/20" />
                            <div className="h-2 w-1/2 rounded bg-white/10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 -z-10 bg-brand-500/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
