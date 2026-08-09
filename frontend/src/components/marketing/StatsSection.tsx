"use client";

import { useLocale } from "@/lib/i18n";

const STATS = [
  { value: "24/7", key: "mkt.stats.support" },
  { value: "99.9%", key: "mkt.stats.uptime" },
  { value: "5s", key: "mkt.stats.updateInterval" },
  { value: "100%", key: "mkt.stats.local" },
] as const;

export function StatsSection() {
  const { t } = useLocale();

  return (
    <section className="border-b border-surface-200 bg-surface-50">
      <div className="mkt-container px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.key} className="mkt-stat">
              <div className="mkt-stat-value">{stat.value}</div>
              <div className="mkt-stat-label">{t(stat.key)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
