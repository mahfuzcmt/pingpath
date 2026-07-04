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
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.map": { en: "Map", bn: "মানচিত্র" },
  "nav.devices": { en: "Devices", bn: "ডিভাইস" },
  "nav.vehicles": { en: "Vehicles", bn: "যানবাহন" },
  "nav.geofences": { en: "Geofences", bn: "জিও-ফেন্স" },
  "nav.trips": { en: "Trips", bn: "ট্রিপ" },
  "nav.alarms": { en: "Alarms", bn: "অ্যালার্ম" },
  "nav.reports": { en: "Reports", bn: "রিপোর্ট" },
  "nav.settings": { en: "Settings", bn: "সেটিংস" },
  "nav.auditLog": { en: "Audit log", bn: "অডিট লগ" },
  "nav.scheduled": { en: "Scheduled", bn: "নির্ধারিত" },
  "nav.rules": { en: "Rules", bn: "নিয়ম" },

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
  "fleet.viewHistory": { en: "View Route History", bn: "রুট ইতিহাস দেখুন" },
  "fleet.routeHistory": { en: "Route History", bn: "রুট ইতিহাস" },
  "fleet.period": { en: "Period", bn: "সময়কাল" },
  "fleet.pointDetails": { en: "Point Details", bn: "পয়েন্ট বিস্তারিত" },
  "fleet.gsm": { en: "GSM", bn: "জিএসএম" },
  "fleet.engineHours": { en: "Engine hours", bn: "ইঞ্জিন ঘণ্টা" },
  "fleet.sim": { en: "SIM", bn: "সিম" },
  "fleet.cellFallback": { en: "Cell-tower fix", bn: "সেল-টাওয়ার ফিক্স" },
  "fleet.noFix": { en: "No GPS fix", bn: "জিপিএস নেই" },

  // ── Vehicle detail tabs (AutoNemo-aligned) ────────────────────────
  "det.track": { en: "Track", bn: "ট্র্যাক" },
  "det.calendar": { en: "Calendar", bn: "ক্যালেন্ডার" },
  "det.history": { en: "History", bn: "ইতিহাস" },
  "det.stats": { en: "Statistics", bn: "পরিসংখ্যান" },

  // ── Home summary (AutoNemo-aligned) ───────────────────────────────
  "home.fleetStatus": { en: "Fleet Status", bn: "ফ্লিট অবস্থা" },
  "home.vehicleStats": { en: "Single Vehicle Stats", bn: "একক যানবাহন পরিসংখ্যান" },
  "home.today": { en: "Today · Asia/Dhaka", bn: "আজ · এশিয়া/ঢাকা" },
  "home.selectVehicle": { en: "Select a vehicle", bn: "যানবাহন নির্বাচন করুন" },
  "home.routeLength": { en: "Route length", bn: "রুট দৈর্ঘ্য" },
  "home.moveDuration": { en: "Move duration", bn: "চলার সময়" },
  "home.idleDuration": { en: "Idle duration", bn: "নিষ্ক্রিয় সময়" },
  "home.stopDuration": { en: "Stop duration", bn: "থামার সময়" },
  "home.topSpeed": { en: "Top speed", bn: "সর্বোচ্চ গতি" },
  "home.trips": { en: "Trips", bn: "ট্রিপ" },
  "home.total": { en: "Total", bn: "মোট" },
  "home.noVehicles": { en: "No vehicles yet.", bn: "এখনও কোনো যানবাহন নেই।" },
  "home.fuelNote": { en: "Fuel cost needs per-vehicle fuel settings (not configured).", bn: "জ্বালানি খরচের জন্য প্রতি-যানবাহন সেটিংস প্রয়োজন (কনফিগার করা নেই)।" },

  // ── Vehicles screen (AutoNemo-aligned) ────────────────────────────
  "veh.title": { en: "Vehicles", bn: "যানবাহন" },
  "veh.all": { en: "All", bn: "সব" },
  "veh.moving": { en: "Moving", bn: "চলমান" },
  "veh.idle": { en: "Idle", bn: "নিষ্ক্রিয়" },
  "veh.stopped": { en: "Stopped", bn: "থেমে আছে" },
  "veh.expired": { en: "Expired", bn: "মেয়াদোত্তীর্ণ" },
  "veh.offline": { en: "Offline", bn: "অফলাইন" },
  "veh.nodata": { en: "No Data", bn: "ডেটা নেই" },
  "veh.since": { en: "since", bn: "থেকে" },
  "veh.expiresOn": { en: "Expires", bn: "মেয়াদ" },
  "veh.updated": { en: "Updated", bn: "আপডেট" },
  "veh.locked": { en: "Engine locked", bn: "ইঞ্জিন লক" },
  "veh.count": { en: "vehicles", bn: "যানবাহন" },
  "veh.none": { en: "No vehicles match your filter.", bn: "কোনো যানবাহন মেলেনি।" },

  // ── Dashboard KPI strip ───────────────────────────────────────────
  "kpi.online": { en: "Online", bn: "অনলাইন" },
  "kpi.offline": { en: "Offline", bn: "অফলাইন" },
  "kpi.alertsToday": { en: "Alerts today", bn: "আজকের অ্যালার্ট" },
  "kpi.critical": { en: "critical", bn: "জরুরি" },
  "kpi.tripsActive": { en: "Active trips", bn: "চলমান ট্রিপ" },
  "kpi.done": { en: "done today", bn: "আজ শেষ" },
  "kpi.distanceToday": { en: "Distance today", bn: "আজকের দূরত্ব" },
  "kpi.km": { en: "km", bn: "কিমি" },

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

  // ── Settings ──────────────────────────────────────────────────────
  "settings.title": { en: "Settings", bn: "সেটিংস" },
  "settings.tab.org": { en: "Organization", bn: "প্রতিষ্ঠান" },
  "settings.tab.users": { en: "Users", bn: "ব্যবহারকারী" },
  "settings.org.name": { en: "Organization name", bn: "প্রতিষ্ঠানের নাম" },
  "settings.org.contactEmail": { en: "Contact email", bn: "যোগাযোগ ইমেইল" },
  "settings.org.contactPhone": { en: "Contact phone", bn: "যোগাযোগ ফোন" },
  "settings.org.address": { en: "Address", bn: "ঠিকানা" },
  "settings.org.locale": { en: "Default language", bn: "ডিফল্ট ভাষা" },
  "settings.org.timezone": { en: "Timezone", bn: "টাইমজোন" },
  "settings.org.plan": { en: "Plan", bn: "প্ল্যান" },
  "settings.org.saved": { en: "Saved", bn: "সংরক্ষিত" },

  "users.title": { en: "Users", bn: "ব্যবহারকারী" },
  "users.add": { en: "Add user", bn: "ব্যবহারকারী যোগ করুন" },
  "users.edit": { en: "Edit", bn: "সম্পাদনা" },
  "users.disable": { en: "Disable", bn: "নিষ্ক্রিয়" },
  "users.enable": { en: "Enable", bn: "সক্রিয়" },
  "users.email": { en: "Email", bn: "ইমেইল" },
  "users.phone": { en: "Phone", bn: "ফোন" },
  "users.fullName": { en: "Full name", bn: "পুরো নাম" },
  "users.role": { en: "Role", bn: "ভূমিকা" },
  "users.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "users.passwordHint": { en: "Leave blank to keep current", bn: "একই রাখতে খালি রাখুন" },
  "users.lastLogin": { en: "Last login", bn: "সর্বশেষ লগইন" },
  "users.status": { en: "Status", bn: "অবস্থা" },
  "users.active": { en: "Active", bn: "সক্রিয়" },
  "users.inactive": { en: "Inactive", bn: "নিষ্ক্রিয়" },
  "users.role.SUPER_ADMIN": { en: "Super admin", bn: "সুপার অ্যাডমিন" },
  "users.role.ORG_ADMIN": { en: "Admin", bn: "অ্যাডমিন" },
  "users.role.ORG_USER": { en: "User", bn: "ব্যবহারকারী" },

  // ── Scheduled commands ────────────────────────────────────────────
  "sched.title": { en: "Scheduled commands", bn: "নির্ধারিত কমান্ড" },
  "sched.new": { en: "Schedule new", bn: "নতুন নির্ধারণ" },
  "sched.device": { en: "Device", bn: "ডিভাইস" },
  "sched.command": { en: "Command", bn: "কমান্ড" },
  "sched.when": { en: "When", bn: "কখন" },
  "sched.nextRun": { en: "Next run", bn: "পরবর্তী রান" },
  "sched.status": { en: "Status", bn: "অবস্থা" },
  "sched.lastAttempt": { en: "Last attempt", bn: "সর্বশেষ চেষ্টা" },
  "sched.cancel": { en: "Cancel", bn: "বাতিল" },
  "sched.kind.ONE_TIME": { en: "One-time", bn: "এককালীন" },
  "sched.kind.DAILY": { en: "Daily", bn: "প্রতিদিন" },
  "sched.type.CUT_FUEL": { en: "Cut fuel", bn: "জ্বালানি বন্ধ" },
  "sched.type.RESTORE_FUEL": { en: "Restore fuel", bn: "জ্বালানি চালু" },
  "sched.type.QUERY_ADDRESS": { en: "Query address", bn: "অবস্থান জিজ্ঞাসা" },
  "sched.type.RAW": { en: "Raw command", bn: "র কমান্ড" },
  "sched.rawCommand": { en: "Raw GT06 command", bn: "র GT06 কমান্ড" },
  "sched.devicePassword": { en: "Device password", bn: "ডিভাইস পাসওয়ার্ড" },
  "sched.runAt": { en: "Run at", bn: "চালানোর সময়" },
  "sched.timeOfDay": { en: "Time of day", bn: "দিনের সময়" },
  "sched.daysOfWeek": { en: "Days of week", bn: "সপ্তাহের দিন" },
  "sched.everyDay": { en: "Every day", bn: "প্রতিদিন" },
  "sched.empty": { en: "No scheduled commands yet", bn: "এখনো কোনো নির্ধারিত কমান্ড নেই" },
  "sched.day.0": { en: "Sun", bn: "রবি" },
  "sched.day.1": { en: "Mon", bn: "সোম" },
  "sched.day.2": { en: "Tue", bn: "মঙ্গল" },
  "sched.day.3": { en: "Wed", bn: "বুধ" },
  "sched.day.4": { en: "Thu", bn: "বৃহঃ" },
  "sched.day.5": { en: "Fri", bn: "শুক্র" },
  "sched.day.6": { en: "Sat", bn: "শনি" },

  // ── Alarm rules ───────────────────────────────────────────────────
  "rules.title": { en: "Alarm rules", bn: "অ্যালার্ম নিয়ম" },
  "rules.new": { en: "New rule", bn: "নতুন নিয়ম" },
  "rules.name": { en: "Name", bn: "নাম" },
  "rules.type": { en: "Type", bn: "ধরন" },
  "rules.threshold": { en: "Threshold", bn: "সীমা" },
  "rules.window": { en: "Window", bn: "সময়সীমা" },
  "rules.cooldown": { en: "Cooldown", bn: "কুলডাউন" },
  "rules.severity": { en: "Severity", bn: "গুরুত্ব" },
  "rules.active": { en: "Active", bn: "সক্রিয়" },
  "rules.appliesTo": { en: "Applies to", bn: "প্রযোজ্য" },
  "rules.allDevices": { en: "All devices", bn: "সব ডিভাইস" },
  "rules.specificDevices": { en: "Specific devices", bn: "নির্দিষ্ট ডিভাইস" },
  "rules.empty": { en: "No alarm rules yet", bn: "কোনো অ্যালার্ম নিয়ম নেই" },
  "rules.type.SPEED_OVER": { en: "Speed over", bn: "অতিরিক্ত গতি" },
  "rules.type.VOLTAGE_UNDER": { en: "Voltage under", bn: "কম ভোল্টেজ" },
  "rules.type.ACC_ON_DURING_WINDOW": { en: "Engine on during window", bn: "নির্দিষ্ট সময়ে ইঞ্জিন চালু" },
  "rules.unit.kph": { en: "km/h", bn: "কিমি/ঘ" },
  "rules.unit.mv": { en: "mV", bn: "মিভো" },
  "rules.unit.seconds": { en: "seconds", bn: "সেকেন্ড" },

  // ── Audit log ─────────────────────────────────────────────────────
  "audit.title": { en: "Audit log", bn: "অডিট লগ" },
  "audit.action": { en: "Action", bn: "কর্ম" },
  "audit.actor": { en: "Actor", bn: "অভিনেতা" },
  "audit.resource": { en: "Resource", bn: "রিসোর্স" },
  "audit.ip": { en: "IP", bn: "আইপি" },
  "audit.when": { en: "When", bn: "কখন" },
  "audit.metadata": { en: "Details", bn: "বিস্তারিত" },
  "audit.allActions": { en: "All actions", bn: "সব কর্ম" },
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
