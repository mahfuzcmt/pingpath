"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "../LanguageContext";

const PHONE = "+880 1629-563645";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={staggerContainer} className={className}>
      {children}
    </motion.div>
  );
}

function Icon({ path, className = "h-6 w-6" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  check: "M20 6L9 17l-5-5",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
};

const PRODUCTS = [
  {
    id: "gt06n",
    titleKey: "productsPage.gt06n.title",
    subtitleKey: "productsPage.gt06n.subtitle",
    descKey: "productsPage.gt06n.desc",
    image: "/images/products/wired-gps.png",
    featureKeys: [
      "productsPage.gt06n.f1",
      "productsPage.gt06n.f2",
      "productsPage.gt06n.f3",
      "productsPage.gt06n.f4",
      "productsPage.gt06n.f5",
      "productsPage.gt06n.f6",
      "productsPage.gt06n.f7",
      "productsPage.gt06n.f8",
    ],
    badge: "Best Seller",
    badgeColor: "bg-cyan-500",
  },
  {
    id: "wetrack2",
    titleKey: "productsPage.wetrack2.title",
    subtitleKey: "productsPage.wetrack2.subtitle",
    descKey: "productsPage.wetrack2.desc",
    image: "/images/products/wired-gps.png",
    featureKeys: [
      "productsPage.wetrack2.f1",
      "productsPage.wetrack2.f2",
      "productsPage.wetrack2.f3",
      "productsPage.wetrack2.f4",
      "productsPage.wetrack2.f5",
      "productsPage.wetrack2.f6",
      "productsPage.wetrack2.f7",
      "productsPage.wetrack2.f8",
    ],
    badge: "4G",
    badgeColor: "bg-blue-500",
  },
  {
    id: "obd",
    titleKey: "productsPage.obd.title",
    subtitleKey: "productsPage.obd.subtitle",
    descKey: "productsPage.obd.desc",
    image: "/images/products/obd-tracker.png",
    featureKeys: [
      "productsPage.obd.f1",
      "productsPage.obd.f2",
      "productsPage.obd.f3",
      "productsPage.obd.f4",
      "productsPage.obd.f5",
      "productsPage.obd.f6",
      "productsPage.obd.f7",
      "productsPage.obd.f8",
    ],
    badge: "Easy Install",
    badgeColor: "bg-green-500",
  },
  {
    id: "portable",
    titleKey: "productsPage.portable.title",
    subtitleKey: "productsPage.portable.subtitle",
    descKey: "productsPage.portable.desc",
    image: "/images/products/portable-tracker.png",
    featureKeys: [
      "productsPage.portable.f1",
      "productsPage.portable.f2",
      "productsPage.portable.f3",
      "productsPage.portable.f4",
      "productsPage.portable.f5",
      "productsPage.portable.f6",
      "productsPage.portable.f7",
      "productsPage.portable.f8",
    ],
    badge: "Wireless",
    badgeColor: "bg-purple-500",
  },
  {
    id: "motorcycle",
    titleKey: "productsPage.motorcycle.title",
    subtitleKey: "productsPage.motorcycle.subtitle",
    descKey: "productsPage.motorcycle.desc",
    image: "/images/products/wired-gps.png",
    featureKeys: [
      "productsPage.motorcycle.f1",
      "productsPage.motorcycle.f2",
      "productsPage.motorcycle.f3",
      "productsPage.motorcycle.f4",
      "productsPage.motorcycle.f5",
      "productsPage.motorcycle.f6",
      "productsPage.motorcycle.f7",
      "productsPage.motorcycle.f8",
    ],
    badge: "New",
    badgeColor: "bg-orange-500",
  },
  {
    id: "dashcam",
    titleKey: "productsPage.dashcam.title",
    subtitleKey: "productsPage.dashcam.subtitle",
    descKey: "productsPage.dashcam.desc",
    image: "/images/products/dashcam.png",
    featureKeys: [
      "productsPage.dashcam.f1",
      "productsPage.dashcam.f2",
      "productsPage.dashcam.f3",
      "productsPage.dashcam.f4",
      "productsPage.dashcam.f5",
      "productsPage.dashcam.f6",
      "productsPage.dashcam.f7",
      "productsPage.dashcam.f8",
    ],
    badge: "Premium",
    badgeColor: "bg-amber-500",
  },
];

function ProductCard({ product, t, callText }: { product: typeof PRODUCTS[0]; t: (key: string) => string; callText: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl"
    >
      {/* Badge */}
      <div className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${product.badgeColor}`}>
        {product.badge}
      </div>

      {/* Product Image */}
      <div className="flex h-56 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 p-6">
        <div className="relative h-40 w-40 transition-transform group-hover:scale-105">
          <Image
            src={product.image}
            alt={product.id}
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">{t(product.subtitleKey)}</div>
        <h3 className="mt-1 text-xl font-bold text-gray-900">{t(product.titleKey)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{t(product.descKey)}</p>

        {/* Features Grid */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {product.featureKeys.map((featureKey) => (
            <div key={featureKey} className="flex items-center gap-2 text-sm text-gray-600">
              <Icon path={ICONS.check} className="h-4 w-4 shrink-0 text-cyan-500" />
              <span className="truncate">{t(featureKey)}</span>
            </div>
          ))}
        </div>

        {/* Call for Price Button */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <motion.a
            href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-xl"
          >
            <Icon path={ICONS.phone} className="h-5 w-5" />
            {callText}
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

export function ProductsPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 pb-20 pt-32">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mb-4 inline-flex items-center rounded-full bg-cyan-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              {t("productsPage.badge")}
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl font-bold text-white sm:text-5xl">
              {t("productsPage.title")}
            </motion.h1>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
              {t("productsPage.desc")}
            </motion.p>

            {/* Quick Call CTA */}
            <motion.div variants={fadeInUp} className="mt-8">
              <a
                href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-lg font-bold text-white shadow-xl transition-all hover:bg-orange-600 hover:shadow-2xl"
              >
                <Icon path={ICONS.phone} className="h-5 w-5" />
                {PHONE} — {t("products.callForPrice")}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} t={t} callText={t("products.callForPrice")} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeInUp} className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">{t("productsPage.whyChoose")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                {t("productsPage.whyChooseDesc")}
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { titleKey: "productsPage.genuine.title", descKey: "productsPage.genuine.desc" },
                { titleKey: "productsPage.freeInstall.title", descKey: "productsPage.freeInstall.desc" },
                { titleKey: "productsPage.warranty.title", descKey: "productsPage.warranty.desc" },
                { titleKey: "productsPage.support247.title", descKey: "productsPage.support247.desc" },
              ].map((item) => (
                <div key={item.titleKey} className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <h3 className="font-semibold text-gray-900">{t(item.titleKey)}</h3>
                  <p className="mt-2 text-sm text-gray-600">{t(item.descKey)}</p>
                </div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">{t("productsPage.needHelp")}</h2>
          <p className="mt-4 text-lg text-blue-100">
            {t("productsPage.needHelpDesc")}
          </p>
          <a
            href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-xl transition-all hover:bg-gray-50"
          >
            <Icon path={ICONS.phone} className="h-6 w-6" />
            {t("productsPage.callNow")}: {PHONE}
          </a>
        </div>
      </section>
    </>
  );
}
