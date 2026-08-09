"use client";

import { useLocale } from "@/lib/i18n";
import { PricingCard } from "@/components/marketing/PricingCard";
import { CTASection } from "@/components/marketing/CTASection";

const HARDWARE = [
  {
    titleKey: "mkt.hardware.basic.title" as const,
    priceKey: "mkt.hardware.basic.price" as const,
    descKey: "mkt.hardware.basic.desc" as const,
  },
  {
    titleKey: "mkt.hardware.pro.title" as const,
    priceKey: "mkt.hardware.pro.price" as const,
    descKey: "mkt.hardware.pro.desc" as const,
  },
  {
    titleKey: "mkt.hardware.enterprise.title" as const,
    priceKey: "mkt.hardware.enterprise.price" as const,
    descKey: "mkt.hardware.enterprise.desc" as const,
  },
];

const FAQ = [
  { qKey: "mkt.faq.q1" as const, aKey: "mkt.faq.a1" as const },
  { qKey: "mkt.faq.q2" as const, aKey: "mkt.faq.a2" as const },
  { qKey: "mkt.faq.q3" as const, aKey: "mkt.faq.a3" as const },
  { qKey: "mkt.faq.q4" as const, aKey: "mkt.faq.a4" as const },
  { qKey: "mkt.faq.q5" as const, aKey: "mkt.faq.a5" as const },
  { qKey: "mkt.faq.q6" as const, aKey: "mkt.faq.a6" as const },
];

export default function PricingPage() {
  const { t } = useLocale();

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-dark">
        <div className="mkt-container text-center">
          <h1 className="mkt-heading-xl text-white">
            {t("mkt.pricing.title")}
          </h1>
          <p className="mkt-body mx-auto mt-4 max-w-2xl text-ink-300">
            {t("mkt.pricing.subtitle")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="grid gap-8 md:grid-cols-3">
            <PricingCard tier="basic" />
            <PricingCard tier="pro" popular />
            <PricingCard tier="enterprise" />
          </div>

          <p className="mt-8 text-center text-sm text-ink-500">
            {t("mkt.pricing.billed")}. All prices exclude VAT.
          </p>
        </div>
      </section>

      {/* Hardware */}
      <section className="mkt-section bg-surface-50">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mkt-heading-md">
              {t("mkt.hardware.title")}
            </h2>
            <p className="mkt-body mt-4">
              {t("mkt.hardware.subtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {HARDWARE.map((item) => (
              <div key={item.titleKey} className="mkt-card text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                  <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ink-900">{t(item.titleKey)}</h3>
                <p className="mt-2 text-2xl font-bold text-brand-500">{t(item.priceKey)}</p>
                <p className="mt-2 text-sm text-ink-500">{t(item.descKey)}</p>
                <p className="mt-4 text-xs text-status-moving font-medium">{t("mkt.hardware.includes")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mkt-heading-md">
              {t("mkt.payment.title")}
            </h2>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {/* bKash */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-[#E2136E]/10">
                <span className="text-2xl font-bold text-[#E2136E]">bKash</span>
              </div>
              <span className="text-sm text-ink-500">{t("mkt.payment.bkash")}</span>
            </div>

            {/* Nagad */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-[#F37021]/10">
                <span className="text-2xl font-bold text-[#F37021]">নগদ</span>
              </div>
              <span className="text-sm text-ink-500">{t("mkt.payment.nagad")}</span>
            </div>

            {/* Bank */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-surface-100">
                <svg className="h-8 w-8 text-ink-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>
              <span className="text-sm text-ink-500">{t("mkt.payment.bank")}</span>
            </div>

            {/* Cash */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-surface-100">
                <svg className="h-8 w-8 text-ink-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <span className="text-sm text-ink-500">{t("mkt.payment.cash")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mkt-section bg-surface-50">
        <div className="mkt-container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mkt-heading-md">
              {t("mkt.faq.title")}
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            {FAQ.map((item, idx) => (
              <details key={idx} className="group mkt-accordion-item">
                <summary className="mkt-accordion-trigger cursor-pointer list-none">
                  <span>{t(item.qKey)}</span>
                  <svg className="h-5 w-5 text-ink-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="mkt-accordion-content">
                  <p>{t(item.aKey)}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
