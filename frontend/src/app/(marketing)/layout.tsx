"use client";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { LanguageProvider } from "@/components/landing/LanguageContext";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
