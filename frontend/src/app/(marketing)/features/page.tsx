"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { CTASection } from "@/components/marketing/CTASection";

const GPS_FEATURES = [
  {
    titleKey: "mkt.features.realtime.title" as const,
    descKey: "mkt.features.realtime.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.history.title" as const,
    descKey: "mkt.features.history.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.geofence.title" as const,
    descKey: "mkt.features.geofence.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.speed.title" as const,
    descKey: "mkt.features.speed.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.fuel.title" as const,
    descKey: "mkt.features.fuel.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.ignition.title" as const,
    descKey: "mkt.features.ignition.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.sos.title" as const,
    descKey: "mkt.features.sos.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
];

const DASHBOARD_FEATURES = [
  {
    titleKey: "mkt.features.dashboard.title" as const,
    descKey: "mkt.features.dashboard.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.reports.title" as const,
    descKey: "mkt.features.reports.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.mobile.title" as const,
    descKey: "mkt.features.mobile.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.multiuser.title" as const,
    descKey: "mkt.features.multiuser.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.features.api.title" as const,
    descKey: "mkt.features.api.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
];

export default function FeaturesPage() {
  const { t } = useLocale();

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-dark">
        <div className="mkt-container text-center">
          <h1 className="mkt-heading-xl text-white">
            {t("mkt.features.title")}
          </h1>
          <p className="mkt-body mx-auto mt-4 max-w-2xl text-ink-300">
            {t("mkt.features.subtitle")}
          </p>
        </div>
      </section>

      {/* GPS Features */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="mb-12 md:mb-16">
            <span className="mkt-badge">GPS Tracking</span>
            <h2 className="mkt-heading-md mt-4">Real-Time GPS Features</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {GPS_FEATURES.map((feature, idx) => (
              <div key={idx} className="flex gap-5">
                <div className="mkt-icon-container flex-shrink-0 h-14 w-14">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-2 text-ink-600 leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Features */}
      <section className="mkt-section bg-surface-50">
        <div className="mkt-container">
          <div className="mb-12 md:mb-16">
            <span className="mkt-badge">Fleet Dashboard</span>
            <h2 className="mkt-heading-md mt-4">Powerful Management Tools</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {DASHBOARD_FEATURES.map((feature, idx) => (
              <div key={idx} className="flex gap-5">
                <div className="mkt-icon-container flex-shrink-0 h-14 w-14">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-2 text-ink-600 leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mkt-heading-md">See the Dashboard in Action</h2>
            <p className="mkt-body mt-4">
              Intuitive interface designed for fleet managers. Works on desktop, tablet, and mobile.
            </p>
          </div>

          <div className="relative mx-auto mt-12 max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-surface-200 bg-surface-50 shadow-lg">
              {/* Dashboard mockup */}
              <div className="aspect-video bg-gradient-to-br from-surface-100 to-surface-200 p-6">
                <div className="flex h-full gap-4">
                  {/* Sidebar mockup */}
                  <div className="w-48 rounded-lg bg-white p-3 shadow-sm">
                    <div className="mb-4 h-8 w-24 rounded bg-brand-500" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`h-8 rounded ${i === 2 ? "bg-brand-50" : "bg-surface-100"}`} />
                      ))}
                    </div>
                  </div>
                  {/* Map area mockup */}
                  <div className="flex-1 rounded-lg bg-brand-50/50 relative">
                    <div className="absolute inset-4 grid grid-cols-6 grid-rows-4 gap-1 opacity-20">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="rounded bg-brand-200" />
                      ))}
                    </div>
                    <div className="absolute top-1/4 left-1/3 h-4 w-4 rounded-full bg-status-moving shadow-lg" />
                    <div className="absolute top-1/2 left-1/2 h-4 w-4 rounded-full bg-status-moving shadow-lg" />
                    <div className="absolute top-2/3 left-1/4 h-4 w-4 rounded-full bg-status-idle shadow-lg" />
                    <div className="absolute top-1/3 right-1/4 h-4 w-4 rounded-full bg-status-stopped shadow-lg" />
                  </div>
                  {/* Side panel mockup */}
                  <div className="w-64 rounded-lg bg-white p-3 shadow-sm">
                    <div className="mb-3 h-6 w-32 rounded bg-surface-200" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 rounded bg-surface-50 p-2">
                          <div className="h-8 w-8 rounded bg-brand-100" />
                          <div className="flex-1 space-y-1">
                            <div className="h-3 w-3/4 rounded bg-surface-200" />
                            <div className="h-2 w-1/2 rounded bg-surface-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
