"use client";

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "bn";

const STRINGS = {
  // ── Auth ──────────────────────────────────────────────────────────
  "auth.signIn": { en: "Sign in", bn: "সাইন ইন" },
  "auth.email": { en: "Email", bn: "ইমেইল" },
  "auth.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "auth.rememberMe": { en: "Remember me", bn: "আমাকে মনে রাখুন" },
  "auth.forgotPassword": { en: "Forgot password?", bn: "পাসওয়ার্ড ভুলে গেছেন?" },
  "auth.signOut": { en: "Sign out", bn: "সাইন আউট" },
  "auth.loginFailed": { en: "Invalid email or password", bn: "ভুল ইমেইল বা পাসওয়ার্ড" },

  // ── Nav ───────────────────────────────────────────────────────────
  "nav.dashboard": { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  "nav.devices": { en: "Devices", bn: "ডিভাইস" },
  "nav.geofences": { en: "Geofences", bn: "জিও-ফেন্স" },
  "nav.trips": { en: "Trips", bn: "ট্রিপ" },
  "nav.alarms": { en: "Alarms", bn: "অ্যালার্ম" },
  "nav.reports": { en: "Reports", bn: "রিপোর্ট" },
  "nav.settings": { en: "Settings", bn: "সেটিংস" },

  // ── Map / fleet ───────────────────────────────────────────────────
  "fleet.title": { en: "Live fleet", bn: "লাইভ ফ্লিট" },
  "fleet.online": { en: "Online", bn: "অনলাইন" },
  "fleet.offline": { en: "Offline", bn: "অফলাইন" },
  "fleet.neverConnected": { en: "Never connected", bn: "কখনও সংযুক্ত হয়নি" },
  "fleet.search": { en: "Search vehicle…", bn: "যানবাহন খুঁজুন…" },
  "fleet.lastSeen": { en: "Last seen", bn: "সর্বশেষ দেখা" },
  "fleet.speed": { en: "Speed", bn: "গতি" },
  "fleet.course": { en: "Course", bn: "দিক" },
  "fleet.voltage": { en: "Voltage", bn: "ভোল্টেজ" },
  "fleet.acc": { en: "Ignition", bn: "ইগনিশন" },
  "fleet.accOn": { en: "On", bn: "চালু" },
  "fleet.accOff": { en: "Off", bn: "বন্ধ" },
  "fleet.noDevices": { en: "No devices yet", bn: "এখনও কোনো ডিভাইস নেই" },
  "fleet.kmh": { en: "km/h", bn: "কিমি/ঘ" },

  // ── Common ────────────────────────────────────────────────────────
  "common.loading": { en: "Loading…", bn: "লোড হচ্ছে…" },
  "common.close": { en: "Close", bn: "বন্ধ করুন" },
  "common.retry": { en: "Retry", bn: "আবার চেষ্টা" },
  "common.save": { en: "Save", bn: "সংরক্ষণ" },
  "common.cancel": { en: "Cancel", bn: "বাতিল" },
  "common.delete": { en: "Delete", bn: "মুছুন" },
  "common.create": { en: "Create", bn: "তৈরি করুন" },
  "common.empty": { en: "Nothing here yet", bn: "এখনো কিছু নেই" },
  "common.from": { en: "From", bn: "থেকে" },
  "common.to": { en: "To", bn: "পর্যন্ত" },
  "common.download": { en: "Download CSV", bn: "CSV ডাউনলোড" },
  "common.acknowledge": { en: "Acknowledge", bn: "নিশ্চিত করুন" },
  "common.acknowledged": { en: "Acknowledged", bn: "নিশ্চিত করা হয়েছে" },

  // ── Alarms ────────────────────────────────────────────────────────
  "alarms.title": { en: "Alarms", bn: "অ্যালার্ম" },
  "alarms.unackedOnly": { en: "Only unacknowledged", bn: "শুধু নিশ্চিত-না-করা" },
  "alarms.banner": { en: "New alarm", bn: "নতুন অ্যালার্ম" },
  "alarms.severity": { en: "Severity", bn: "গুরুত্ব" },
  "alarms.type": { en: "Type", bn: "ধরন" },

  // ── Geofences ─────────────────────────────────────────────────────
  "geo.title": { en: "Geofences", bn: "জিও-ফেন্স" },
  "geo.new": { en: "New geofence", bn: "নতুন জিও-ফেন্স" },
  "geo.name": { en: "Name", bn: "নাম" },
  "geo.shape": { en: "Shape", bn: "আকৃতি" },
  "geo.circle": { en: "Circle", bn: "বৃত্ত" },
  "geo.polygon": { en: "Polygon", bn: "বহুভুজ" },
  "geo.radius": { en: "Radius (m)", bn: "ব্যাসার্ধ (মি)" },
  "geo.notifyOn": { en: "Notify on", bn: "বিজ্ঞপ্তি" },
  "geo.notifyEnter": { en: "Enter", bn: "প্রবেশ" },
  "geo.notifyExit": { en: "Exit", bn: "প্রস্থান" },
  "geo.notifyBoth": { en: "Both", bn: "উভয়" },
  "geo.assignedDevices": { en: "Assigned devices", bn: "নির্ধারিত ডিভাইস" },
  "geo.clickToSetCenter": { en: "Click on the map to set the center", bn: "কেন্দ্র সেট করতে মানচিত্রে ক্লিক করুন" },
  "geo.clickToAddVertex": { en: "Click to add a vertex (≥3 to save)", bn: "ভার্টেক্স যোগ করতে ক্লিক করুন (সংরক্ষণে ≥৩)" },

  // ── Trips ─────────────────────────────────────────────────────────
  "trips.title": { en: "Trips", bn: "ট্রিপ" },
  "trips.startedAt": { en: "Started", bn: "শুরু" },
  "trips.endedAt": { en: "Ended", bn: "শেষ" },
  "trips.distance": { en: "Distance", bn: "দূরত্ব" },
  "trips.duration": { en: "Duration", bn: "সময়কাল" },
  "trips.maxSpeed": { en: "Max speed", bn: "সর্বোচ্চ গতি" },
  "trips.avgSpeed": { en: "Avg speed", bn: "গড় গতি" },
  "trips.replay": { en: "Replay", bn: "রিপ্লে" },
  "trips.inProgress": { en: "In progress", bn: "চলমান" },

  // ── Reports ───────────────────────────────────────────────────────
  "reports.title": { en: "Reports", bn: "রিপোর্ট" },
  "reports.tripsReport": { en: "Trips report", bn: "ট্রিপ রিপোর্ট" },
  "reports.alarmsReport": { en: "Alarms report", bn: "অ্যালার্ম রিপোর্ট" },

  "lang.toggle": { en: "বাংলা", bn: "English" },
} as const;

export type StringKey = keyof typeof STRINGS;

interface LocaleCtx {
  locale: Locale;
  t: (key: StringKey) => string;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
    document.cookie = `pp_locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, []);

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      setLocale,
      t: (key: StringKey) => STRINGS[key][locale],
    }),
    [locale, setLocale],
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
