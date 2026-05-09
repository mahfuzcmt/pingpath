import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";

// Use system fonts when Google Fonts are unavailable (e.g., restricted network)
// CSS variables are set in globals.css with fallback system fonts

export const metadata: Metadata = {
  title: "PingPath — Fleet Tracking",
  description: "Multi-tenant GPS tracking for Bangladesh fleets.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0A1928",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("pp_locale")?.value === "bn" ? "bn" : "en") as "en" | "bn";

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
