"use client";

import { useLocale, type StringKey } from "@/lib/i18n";

export function Placeholder({ titleKey }: { titleKey: StringKey }) {
  const { t } = useLocale();
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="font-display text-xl">{t(titleKey)}</div>
        <div className="mt-1 text-sm text-ink-400">Coming in a later phase.</div>
      </div>
    </div>
  );
}
