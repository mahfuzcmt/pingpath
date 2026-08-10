"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
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
  arrow: "M5 12h14M12 5l7 7-7 7",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  cart: "M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
};

// Product categories for filtering
type ProductCategory = "ALL" | "WIRED" | "4G" | "OBD" | "WIRELESS" | "DASHCAM";

interface Product {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descKey: string;
  image: string;
  featureKeys: string[];
  category: ProductCategory;
  categoryBadge: string;
  categoryColor: string;
  // Pricing
  price: number | null; // BDT, null = "Contact for price"
  originalPrice?: number; // For showing discounts
  // Warranty
  warrantyMonths: number;
  // Installation
  freeInstallation: boolean;
}

const PRODUCTS: Product[] = [
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
    ],
    category: "WIRED",
    categoryBadge: "productsPage.badge.wired",
    categoryColor: "bg-emerald-500",
    price: 4500,
    warrantyMonths: 12,
    freeInstallation: true,
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
    ],
    category: "4G",
    categoryBadge: "productsPage.badge.4g",
    categoryColor: "bg-blue-600",
    price: 6500,
    warrantyMonths: 12,
    freeInstallation: true,
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
    ],
    category: "OBD",
    categoryBadge: "productsPage.badge.obd",
    categoryColor: "bg-violet-500",
    price: 5500,
    warrantyMonths: 12,
    freeInstallation: false, // Plug & Play - no installation needed
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
    ],
    category: "WIRELESS",
    categoryBadge: "productsPage.badge.wireless",
    categoryColor: "bg-purple-500",
    price: 7500,
    warrantyMonths: 12,
    freeInstallation: false, // Wireless - no installation
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
    ],
    category: "WIRED",
    categoryBadge: "productsPage.badge.wired",
    categoryColor: "bg-emerald-500",
    price: 3500,
    warrantyMonths: 12,
    freeInstallation: true,
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
    ],
    category: "DASHCAM",
    categoryBadge: "productsPage.badge.dashcam",
    categoryColor: "bg-amber-500",
    price: 12500,
    originalPrice: 15000,
    warrantyMonths: 12,
    freeInstallation: true,
  },
];

const CATEGORY_FILTERS: { key: ProductCategory; labelKey: string }[] = [
  { key: "ALL", labelKey: "productsPage.filter.all" },
  { key: "WIRED", labelKey: "productsPage.filter.wired" },
  { key: "4G", labelKey: "productsPage.filter.4g" },
  { key: "OBD", labelKey: "productsPage.filter.obd" },
  { key: "WIRELESS", labelKey: "productsPage.filter.wireless" },
  { key: "DASHCAM", labelKey: "productsPage.filter.dashcam" },
];

function formatPrice(price: number, lang: string): string {
  if (lang === "bn") {
    // Bengali numerals
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return price.toLocaleString("en-IN").replace(/\d/g, (d) => bnDigits[parseInt(d)]);
  }
  return price.toLocaleString("en-IN");
}

function ProductCard({ product, t, lang }: { product: Product; t: (key: string) => string; lang: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl"
    >
      {/* Category Badge - Top Left */}
      <div className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${product.categoryColor}`}>
        {t(product.categoryBadge)}
      </div>

      {/* Sale Badge - Top Right (if discount exists) */}
      {product.originalPrice && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase text-white">
          {t("productsPage.badge.sale")}
        </div>
      )}

      {/* Product Image - Premium dark background with subtle glow */}
      <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        {/* Subtle colored glow behind product */}
        <div className={`absolute inset-0 opacity-20 ${product.categoryColor.replace("bg-", "bg-gradient-to-br from-")} to-transparent`} />
        <div className="relative h-44 w-44 transition-transform duration-300 group-hover:scale-110">
          <Image
            src={product.image}
            alt={t(product.titleKey)}
            fill
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Subtitle */}
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          {t(product.subtitleKey)}
        </div>

        {/* Title */}
        <h3 className="mt-1 text-xl font-bold text-gray-900">{t(product.titleKey)}</h3>

        {/* Price Section - Large and Dominant */}
        <div className="mt-4 flex items-baseline gap-3">
          {product.price ? (
            <>
              <span className="text-3xl font-bold text-gray-900">
                ৳{formatPrice(product.price, lang)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  ৳{formatPrice(product.originalPrice, lang)}
                </span>
              )}
            </>
          ) : (
            <span className="text-xl font-semibold text-amber-600">
              {t("productsPage.contactForPrice")}
            </span>
          )}
        </div>

        {/* Warranty - Directly under price */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <Icon path={ICONS.shield} className="h-4 w-4 text-emerald-500" />
          <span>
            {product.warrantyMonths} {t("productsPage.monthWarranty")}
          </span>
          {product.freeInstallation && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-emerald-600 font-medium">{t("productsPage.freeInstall")}</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
          {t(product.descKey)}
        </p>

        {/* Features Grid - Compact */}
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {product.featureKeys.slice(0, 6).map((featureKey) => (
            <div key={featureKey} className="flex items-center gap-1.5 text-xs text-gray-600">
              <Icon path={ICONS.check} className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{t(featureKey)}</span>
            </div>
          ))}
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Dual CTA Buttons */}
        <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
          {/* View Details - Dark button */}
          <Link
            href={`/products/${product.id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-transparent py-3 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-900 hover:text-white"
          >
            <Icon path={ICONS.eye} className="h-4 w-4" />
            {t("productsPage.viewDetails")}
          </Link>

          {/* Buy Now / Get Quote - Bright amber button */}
          <motion.a
            href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:shadow-xl"
          >
            <Icon path={ICONS.cart} className="h-4 w-4" />
            {t("productsPage.getQuote")}
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryFilters({
  activeCategory,
  onCategoryChange,
  t,
}: {
  activeCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {CATEGORY_FILTERS.map((filter) => (
          <motion.button
            key={filter.key}
            onClick={() => onCategoryChange(filter.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              activeCategory === filter.key
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-white text-gray-700 shadow-md hover:bg-gray-50 hover:shadow-lg"
            }`}
          >
            {t(filter.labelKey)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { t, lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("ALL");

  const filteredProducts = activeCategory === "ALL"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Hero Section - Premium Dark Theme */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pb-20 pt-32">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mb-4 inline-flex items-center rounded-full bg-amber-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
              {t("productsPage.badge")}
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl font-bold text-white sm:text-5xl">
              {t("productsPage.title")}
            </motion.h1>
            <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              {t("productsPage.desc")}
            </motion.p>

            {/* Quick Stats */}
            <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center justify-center gap-8">
              {[
                { value: "৳3,500", labelKey: "productsPage.startingFrom" },
                { value: "12", labelKey: "productsPage.monthsWarranty" },
                { value: "24/7", labelKey: "productsPage.supportAvailable" },
              ].map((stat) => (
                <div key={stat.labelKey} className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                  <div className="text-sm text-gray-500">{t(stat.labelKey)}</div>
                </div>
              ))}
            </motion.div>

            {/* Quick Call CTA */}
            <motion.div variants={fadeInUp} className="mt-10">
              <a
                href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-lg font-bold text-white shadow-xl shadow-amber-500/30 transition-all hover:bg-amber-600 hover:shadow-2xl"
              >
                <Icon path={ICONS.phone} className="h-5 w-5" />
                {PHONE}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products Grid with Filters */}
      <section className="bg-gray-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            {/* Category Filters */}
            <CategoryFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              t={t}
            />

            {/* Products Grid */}
            <motion.div layout className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} t={t} lang={lang} />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* No products message */}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <p className="text-lg text-gray-500">{t("productsPage.noProducts")}</p>
              </motion.div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Why Choose Us - Updated with gold accents */}
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
                { titleKey: "productsPage.genuine.title", descKey: "productsPage.genuine.desc", icon: ICONS.shield, color: "text-amber-500" },
                { titleKey: "productsPage.freeInstall.title", descKey: "productsPage.freeInstall.desc", icon: ICONS.check, color: "text-emerald-500" },
                { titleKey: "productsPage.warranty.title", descKey: "productsPage.warranty.desc", icon: ICONS.shield, color: "text-blue-500" },
                { titleKey: "productsPage.support247.title", descKey: "productsPage.support247.desc", icon: ICONS.phone, color: "text-purple-500" },
              ].map((item) => (
                <motion.div
                  key={item.titleKey}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center transition-all hover:border-amber-200 hover:shadow-lg"
                >
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 ${item.color}`}>
                    <Icon path={item.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{t(item.titleKey)}</h3>
                  <p className="mt-2 text-sm text-gray-600">{t(item.descKey)}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA - Gold/Amber theme */}
      <section className="bg-gradient-to-br from-amber-500 to-amber-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">{t("productsPage.needHelp")}</h2>
          <p className="mt-4 text-lg text-amber-100">
            {t("productsPage.needHelpDesc")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-amber-600 shadow-xl transition-all hover:bg-gray-50 hover:shadow-2xl"
            >
              <Icon path={ICONS.phone} className="h-6 w-6" />
              {t("productsPage.callNow")}: {PHONE}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
            >
              {t("productsPage.requestDemo")}
              <Icon path={ICONS.arrow} className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
