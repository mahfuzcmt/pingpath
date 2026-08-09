"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

export function CTASection() {
  const { t } = useLocale();

  return (
    <section className="mkt-section-dark">
      <div className="mkt-container text-center">
        <h2 className="mkt-heading-lg text-white">
          {t("mkt.cta.ready.title")}
        </h2>
        <p className="mkt-body mx-auto mt-4 max-w-2xl text-ink-300">
          {t("mkt.cta.ready.desc")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/contact">
            <button className="mkt-btn-primary min-w-[180px]">
              {t("mkt.nav.getStarted")}
            </button>
          </Link>
          <Link href="/pricing">
            <button className="mkt-btn-white min-w-[180px]">
              {t("mkt.nav.pricing")}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
