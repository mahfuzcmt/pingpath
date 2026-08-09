"use client";

import { useLocale } from "@/lib/i18n";
import { ContactForm } from "@/components/marketing/ContactForm";

const FAQ = [
  { qKey: "mkt.faq.q1" as const, aKey: "mkt.faq.a1" as const },
  { qKey: "mkt.faq.q2" as const, aKey: "mkt.faq.a2" as const },
  { qKey: "mkt.faq.q3" as const, aKey: "mkt.faq.a3" as const },
];

export default function ContactPage() {
  const { t } = useLocale();

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-dark">
        <div className="mkt-container text-center">
          <h1 className="mkt-heading-xl text-white">
            {t("mkt.contact.title")}
          </h1>
          <p className="mkt-body mx-auto mt-4 max-w-2xl text-ink-300">
            {t("mkt.contact.subtitle")}
          </p>
        </div>
      </section>

      {/* Contact Options + Form */}
      <section className="mkt-section bg-white">
        <div className="mkt-container">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Contact Info */}
            <div>
              <h2 className="mkt-heading-sm">Get in Touch</h2>
              <p className="mt-4 text-ink-600">
                Have questions about MotoLink? Our team is here to help. Reach out through any of these channels.
              </p>

              {/* Contact Methods */}
              <div className="mt-8 space-y-6">
                {/* Phone */}
                <div className="flex gap-4">
                  <div className="mkt-icon-container flex-shrink-0">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">{t("mkt.contact.phone")}</h3>
                    <a href="tel:+8801629563645" className="mt-1 text-brand-500 hover:underline">
                      +880 1629-563645
                    </a>
                    <p className="mt-1 text-sm text-ink-500">
                      {t("mkt.contact.hours.value")}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4">
                  <div className="mkt-icon-container flex-shrink-0">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">{t("mkt.contact.email")}</h3>
                    <a href="mailto:hello@motolink.com.bd" className="mt-1 text-brand-500 hover:underline">
                      hello@motolink.com.bd
                    </a>
                    <p className="mt-1 text-sm text-ink-500">
                      We respond within 24 hours
                    </p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex gap-4">
                  <div className="mkt-icon-container flex-shrink-0 bg-[#25D366]/10 text-[#25D366]">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">{t("mkt.whatsapp")}</h3>
                    <a href="https://wa.me/8801629563645" target="_blank" rel="noopener noreferrer" className="mt-1 text-brand-500 hover:underline">
                      +880 1629-563645
                    </a>
                    <p className="mt-1 text-sm text-ink-500">
                      Quick responses during business hours
                    </p>
                  </div>
                </div>

                {/* Office */}
                <div className="flex gap-4">
                  <div className="mkt-icon-container flex-shrink-0">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">{t("mkt.contact.office")}</h3>
                    <p className="mt-1 text-ink-600">
                      Web Innovation<br />
                      Dhaka, Bangladesh
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="tel:+8801629563645" className="mkt-btn-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {t("mkt.callNow")}
                </a>
                <a href="https://wa.me/8801629563645" target="_blank" rel="noopener noreferrer" className="mkt-btn-secondary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t("mkt.whatsapp")}
                </a>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div>
              <ContactForm />
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
    </>
  );
}
