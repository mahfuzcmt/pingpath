"use client";

import { useLocale } from "@/lib/i18n";
import { TestimonialSection } from "@/components/marketing/TestimonialSection";
import { CTASection } from "@/components/marketing/CTASection";

const WHY_MOTOLINK = [
  {
    titleKey: "mkt.about.why.local" as const,
    descKey: "mkt.about.why.local.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.about.why.owned" as const,
    descKey: "mkt.about.why.owned.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.about.why.support" as const,
    descKey: "mkt.about.why.support.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    titleKey: "mkt.about.why.affordable" as const,
    descKey: "mkt.about.why.affordable.desc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-dark">
        <div className="mkt-container text-center">
          <h1 className="mkt-heading-xl text-white">
            {t("mkt.about.title")}
          </h1>
          <p className="mkt-body mx-auto mt-4 max-w-2xl text-ink-300">
            {t("mkt.about.subtitle")}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl">
            <span className="mkt-badge">Our Journey</span>
            <h2 className="mkt-heading-md mt-4">
              {t("mkt.about.story.title")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-600">
              {t("mkt.about.story.p1")}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              {t("mkt.about.story.p2")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mkt-section bg-surface-50">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mkt-badge">Our Purpose</span>
            <h2 className="mkt-heading-md mt-4">
              {t("mkt.about.mission.title")}
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-ink-700">
              {t("mkt.about.mission.desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Why MotoLink */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mkt-heading-md">
              {t("mkt.about.why.title")}
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {WHY_MOTOLINK.map((item, idx) => (
              <div key={idx} className="mkt-card flex gap-5">
                <div className="mkt-icon-container flex-shrink-0 h-14 w-14">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">
                    {t(item.titleKey)}
                  </h3>
                  <p className="mt-2 text-ink-600 leading-relaxed">
                    {t(item.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team (Simple) */}
      <section className="mkt-section bg-surface-50">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mkt-badge">Our Team</span>
            <h2 className="mkt-heading-md mt-4">Built by Engineers, Driven by Service</h2>
            <p className="mkt-body mt-4">
              Our team combines deep technical expertise with a passion for solving real problems.
              We&apos;re based in Dhaka and understand the unique challenges of operating in Bangladesh.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">
                MA
              </div>
              <div className="font-semibold text-ink-900">Mahfuz Ahmed</div>
              <div className="text-sm text-ink-500">Founder & CEO</div>
            </div>
          </div>
        </div>
      </section>

      <TestimonialSection />
      <CTASection />
    </>
  );
}
