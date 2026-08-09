"use client";

import { useLocale, type StringKey } from "@/lib/i18n";

interface FeatureCardProps {
  icon: React.ReactNode;
  titleKey: StringKey;
  descKey: StringKey;
}

export function FeatureCard({ icon, titleKey, descKey }: FeatureCardProps) {
  const { t } = useLocale();

  return (
    <div className="mkt-card-feature">
      <div className="mkt-icon-container">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink-900">
        {t(titleKey)}
      </h3>
      <p className="text-sm leading-relaxed text-ink-600">
        {t(descKey)}
      </p>
    </div>
  );
}
