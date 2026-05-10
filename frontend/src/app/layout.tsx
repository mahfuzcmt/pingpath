import type { Metadata, Viewport } from "next";
import { Open_Sans, JetBrains_Mono, Hind_Siliguri } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PingPath — Fleet Tracking",
  description: "Multi-tenant GPS tracking for Bangladesh fleets.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("pp_locale")?.value === "bn" ? "bn" : "en") as "en" | "bn";

  return (
    <html
      lang={locale}
      className={`${openSans.variable} ${jetbrains.variable} ${hindSiliguri.variable}`}
    >
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
