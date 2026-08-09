"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ────────────────────────────────────────────────────────────────
   MotoLink GPS — Premium dark-theme landing page with glassmorphism.
   Inspired by CopilotAI design: dark backgrounds, teal/cyan gradients.
   ──────────────────────────────────────────────────────────────── */

const CONTACT = {
  hotline: "+880 1629-563645",
  sales: "+880 1629-563645",
  email: "hello@motolink.com.bd",
  address: "Dhaka, Bangladesh",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Products", href: "#products" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

/* ── Animation Variants ─────────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

/* ── Animated Section Wrapper ─────────────────────────────────── */

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={staggerContainer} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Small building blocks ─────────────────────────────────────── */

function Logo({ light = false }: { light?: boolean }) {
  return (
    <motion.div className="flex items-center gap-2.5" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
      <svg width="38" height="38" viewBox="0 0 48 48" fill="none" className="drop-shadow-lg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <path d="M24 6L42 40C42 42 40 44 38 44H10C8 44 6 42 6 40L24 6Z" fill="url(#logoGrad)" />
        <path d="M12 34C15 31 20 29 25 33" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M16 28C19 25 24 24 29 27" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
        <circle cx="14" cy="37" r="2" fill="white" opacity="0.9" />
        <circle cx="21" cy="34" r="1.5" fill="white" opacity="0.8" />
        <circle cx="28" cy="31" r="1.5" fill="white" opacity="0.7" />
      </svg>
      <div>
        <div className={`text-xl font-extrabold leading-tight tracking-tight ${light ? "text-white" : "text-white"}`}>MOTOLINK</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">GPS Tracking</div>
      </div>
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <motion.div variants={fadeInUp} className="mx-auto mb-16 max-w-3xl text-center">
      <motion.div variants={fadeIn} className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-400">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
        {eyebrow}
      </motion.div>
      <h2 className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">{title}</h2>
      {subtitle && <p className="mt-5 text-[16px] leading-relaxed text-slate-400">{subtitle}</p>}
    </motion.div>
  );
}

function Icon({ path, className = "h-6 w-6" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  replay: "M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2",
  fence: "M12 22s7-7.75 7-13a7 7 0 10-14 0c0 5.25 7 13 7 13zM12 12a3 3 0 100-6 3 3 0 000 6z",
  bolt: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  bell: "M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  report: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  gauge: "M12 15l3.5-5.5M8 21h8M3 15a9 9 0 1118 0",
  fuel: "M3 22V5a2 2 0 012-2h7a2 2 0 012 2v17M14 8h4a2 2 0 012 2v4a2 2 0 01-2 2h-4M10 6v4M6 6v4",
  video: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
  temp: "M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  check: "M20 6L9 17l-5-5",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  award: "M12 15l-3 9 3-6 3 6-3-9zM7 21l3-9M17 21l-3-9M12 15a7 7 0 100-14 7 7 0 000 14z",
  arrow: "M5 12h14M12 5l7 7-7 7",
  play: "M5 3l14 9-14 9V3z",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M18 6L6 18M6 6l12 12",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
} as const;

/* ── Glass Card Component ──────────────────────────────────────── */

function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={hover ? { y: -6, scale: 1.01 } : {}}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 ${hover ? "hover:border-teal-500/30 hover:shadow-[0_8px_32px_-8px_rgba(45,212,191,0.15)]" : ""} ${className}`}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Navigation ────────────────────────────────────────────────── */

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050810]/90 shadow-lg shadow-black/20 backdrop-blur-xl" : "bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20">
        <Link href="/" aria-label="MotoLink GPS home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <motion.a key={l.href} href={l.href} whileHover={{ y: -2 }} className="rounded-lg px-4 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:text-teal-400">
              {l.label}
            </motion.a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10">
            Sign In
          </Link>
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30"
          >
            Get Demo
          </motion.a>
        </div>

        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
          {open ? <Icon path={ICONS.close} /> : <Icon path={ICONS.menu} />}
        </button>
      </div>

      {open && (
        <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/10 bg-[#050810]/95 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[14px] font-medium text-slate-300 hover:bg-white/5 hover:text-white">
                {l.label}
              </a>
            ))}
            <div className="mt-4 flex gap-3">
              <Link href="/login" className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-center text-[13px] font-semibold text-white">Sign In</Link>
              <a href="#contact" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-center text-[13px] font-semibold text-white">Get Demo</a>
            </div>
          </div>
        </motion.nav>
      )}
    </motion.header>
  );
}

/* ── Hero Section ──────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050810]">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:pb-32 lg:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-[13px] font-medium text-teal-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
              </span>
              #1 GPS Tracking in Bangladesh
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-white">Track Your Fleet</span>
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">In Real-Time</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-400">
              Professional GPS tracking platform with live monitoring, fuel tracking, geofencing, route replay, and remote engine control. Built for Bangladesh with Bengali-first interface.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center gap-4">
              <motion.a href="#contact" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="group inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 text-[15px] font-bold text-white shadow-xl shadow-teal-500/25 transition-all hover:shadow-2xl hover:shadow-teal-500/30">
                Start Free Trial
                <Icon path={ICONS.arrow} className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.a href="#features" whileHover={{ scale: 1.02 }} className="inline-flex h-14 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-[15px] font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10">
                <Icon path={ICONS.play} className="h-5 w-5 text-teal-400" />
                Watch Demo
              </motion.a>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-14 flex flex-wrap items-center gap-8 border-t border-white/10 pt-8">
              {[
                { icon: ICONS.shield, label: "BTRC Certified" },
                { icon: ICONS.users, label: "150+ Companies" },
                { icon: ICONS.clock, label: "24/7 Support" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                    <Icon path={item.icon} className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div initial={{ opacity: 0, x: 60, rotateY: -5 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative hidden lg:block">
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-1.5 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-xl bg-[#0a0f1a]">
                <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 text-center text-xs text-slate-500">MotoLink Dashboard</div>
                </div>
                <div className="relative h-[320px] bg-gradient-to-br from-[#0d1420] to-[#080d18] p-4">
                  <div className="absolute inset-4 rounded-lg bg-[#0f1a28]/80">
                    {/* Vehicle markers */}
                    {[
                      { top: "20%", left: "25%", status: "moving", label: "BA-1234" },
                      { top: "45%", left: "55%", status: "parked", label: "DH-5678" },
                      { top: "65%", left: "30%", status: "moving", label: "RA-9012" },
                      { top: "35%", left: "70%", status: "idle", label: "CH-3456" },
                    ].map((v, i) => (
                      <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1 + i * 0.15 }} className="absolute" style={{ top: v.top, left: v.left }}>
                        <motion.div animate={v.status === "moving" ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 2, repeat: Infinity }} className="relative">
                          <div className={`h-4 w-4 rounded-full shadow-lg ${v.status === "moving" ? "bg-teal-500 shadow-teal-500/50" : v.status === "parked" ? "bg-blue-500 shadow-blue-500/50" : "bg-amber-500 shadow-amber-500/50"}`} />
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-medium text-white">{v.label}</div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="absolute bottom-5 left-5 right-5 flex gap-2">
                    {[
                      { label: "Active", value: "24", color: "teal" },
                      { label: "Parked", value: "12", color: "blue" },
                      { label: "Alerts", value: "3", color: "amber" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2.5 backdrop-blur">
                        <div className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</div>
                        <div className="text-[10px] text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-12 top-1/4 rounded-xl border border-white/10 bg-[#0a0f1a]/90 p-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                  <Icon path={ICONS.map} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Live Tracking</div>
                  <div className="text-[11px] text-slate-500">Real-time updates</div>
                </div>
              </div>
            </motion.div>

            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-8 bottom-1/3 rounded-xl border border-white/10 bg-[#0a0f1a]/90 p-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Icon path={ICONS.bell} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Smart Alerts</div>
                  <div className="text-[11px] text-slate-500">Instant notifications</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Stats Section ─────────────────────────────────────────────── */

const STATS = [
  { value: "150+", label: "Corporate Clients", icon: ICONS.users },
  { value: "5,000+", label: "Vehicles Tracked", icon: ICONS.truck },
  { value: "24/7", label: "Live Support", icon: ICONS.clock },
  { value: "99.9%", label: "Uptime SLA", icon: ICONS.shield },
];

function StatsSection() {
  return (
    <section className="relative bg-[#050810] py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/5 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <GlassCard key={stat.label}>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-400">
                    <Icon path={stat.icon} className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Features Section ──────────────────────────────────────────── */

const FEATURES = [
  { icon: ICONS.map, title: "Real-Time Tracking", desc: "Second-by-second GPS updates with live vehicle positions on interactive map." },
  { icon: ICONS.fuel, title: "Fuel Monitoring", desc: "Track fuel levels, detect theft, and optimize consumption with precision sensors." },
  { icon: ICONS.replay, title: "Route Replay", desc: "Replay any trip with speed, stops, and exact route visualization." },
  { icon: ICONS.fence, title: "Geofencing", desc: "Create virtual boundaries with instant enter/exit notifications." },
  { icon: ICONS.bell, title: "Smart Alerts", desc: "SOS, overspeed, power cut alerts via SMS and push notifications." },
  { icon: ICONS.lock, title: "Remote Engine Lock", desc: "Immobilize vehicles remotely for theft prevention and recovery." },
  { icon: ICONS.video, title: "Dashcam Integration", desc: "Live video streaming and AI-powered event recording." },
  { icon: ICONS.report, title: "Fleet Analytics", desc: "Comprehensive reports for performance and driver behavior." },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-20 bg-[#050810] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-cyan-500/5" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <SectionHeading eyebrow="Platform Features" title="Everything You Need for Fleet Management" subtitle="Comprehensive GPS tracking features designed for modern fleet operations." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <GlassCard key={f.title} className="group">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 text-teal-400 transition-colors group-hover:from-teal-500/30 group-hover:to-cyan-500/20">
                  <Icon path={f.icon} className="h-6 w-6" />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Solutions Section ─────────────────────────────────────────── */

const SOLUTIONS = [
  { emoji: "🏥", title: "Healthcare", desc: "Track ambulances and optimize emergency response times." },
  { emoji: "🏗️", title: "Construction", desc: "Monitor heavy equipment and material transport." },
  { emoji: "🚚", title: "Logistics", desc: "Optimize routes and ensure timely deliveries." },
  { emoji: "🛒", title: "FMCG", desc: "Manage distribution fleets and cold chain." },
  { emoji: "🚌", title: "Transport", desc: "School bus tracking with parent notifications." },
  { emoji: "📦", title: "Courier", desc: "Last-mile delivery with proof of delivery." },
];

function SolutionsSection() {
  return (
    <section id="solutions" className="relative scroll-mt-20 bg-[#050810] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <SectionHeading eyebrow="Industry Solutions" title="Tailored for Every Industry" subtitle="Custom tracking solutions for your specific business needs." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <GlassCard key={s.title} className="group">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="mb-4 text-4xl">{s.emoji}</motion.div>
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{s.desc}</p>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Products Section ──────────────────────────────────────────── */

const PRODUCTS = [
  { title: "Wired GPS", desc: "Professional hardwired tracker with engine cut-off.", features: ["Real-time tracking", "Engine immobilizer", "Tamper alerts"], price: "৳3,500", badge: "Popular" },
  { title: "OBD Tracker", desc: "Plug-and-play with vehicle diagnostics.", features: ["2-min install", "DTC codes", "Fuel data"], price: "৳4,500", badge: null },
  { title: "Portable GPS", desc: "Wireless tracker for assets and personal use.", features: ["30-day battery", "Waterproof", "Magnetic"], price: "৳5,000", badge: null },
  { title: "Dashcam GPS", desc: "Dual-camera with integrated tracking.", features: ["Live streaming", "AI detection", "Cloud storage"], price: "৳12,000", badge: "Premium" },
];

function ProductsSection() {
  return (
    <section id="products" className="relative scroll-mt-20 bg-[#050810] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <SectionHeading eyebrow="GPS Devices" title="Premium Tracking Hardware" subtitle="High-quality devices from Concox, Teltonika, and Queclink." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <GlassCard key={p.title} className="relative">
                {p.badge && <div className="absolute -right-2 top-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-[10px] font-bold uppercase text-white">{p.badge}</div>}
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10">
                  <Icon path={ICONS.map} className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-1 text-[13px] text-slate-500">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[12px] text-slate-400">
                      <Icon path={ICONS.check} className="h-4 w-4 text-teal-500" />{f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-2xl font-bold text-white">{p.price}</span>
                  <span className="ml-1 text-sm text-slate-500">one-time</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Pricing Section ───────────────────────────────────────────── */

const PLANS = [
  { name: "Basic", price: "৳200", tagline: "Individual owners", features: ["Real-time tracking", "90-day history", "Mobile app", "Basic alerts", "Email support"], highlight: false },
  { name: "Pro", price: "৳350", tagline: "Small fleets", features: ["Everything in Basic", "Geofence alerts", "Remote engine lock", "Driver reports", "Priority support"], highlight: true },
  { name: "Enterprise", price: "৳500", tagline: "Corporate fleets", features: ["Everything in Pro", "Multi-user access", "API access", "Custom reports", "Dedicated manager"], highlight: false },
];

function PricingSection() {
  return (
    <section id="pricing" className="relative scroll-mt-20 bg-[#050810] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatedSection>
          <SectionHeading eyebrow="Pricing" title="Simple, Transparent Pricing" subtitle="GPS device from ৳3,500. Subscription includes platform, SIM data, and support." />
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <motion.div
                key={p.name}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl border p-8 transition-all ${p.highlight ? "border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 shadow-xl shadow-teal-500/10" : "border-white/10 bg-white/[0.02]"}`}
              >
                {p.highlight && <div className="absolute -right-10 top-6 rotate-45 bg-gradient-to-r from-teal-500 to-cyan-500 px-12 py-1 text-[10px] font-bold uppercase text-white">Popular</div>}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">{p.price}</span>
                  <span className="text-slate-500">/month/vehicle</span>
                </div>
                <ul className="mt-8 flex-1 space-y-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[14px] text-slate-400">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                        <Icon path={ICONS.check} className="h-3 w-3" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.a
                  href="#contact"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`mt-8 block rounded-xl py-3.5 text-center text-[15px] font-semibold transition-all ${p.highlight ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"}`}
                >
                  Get Started
                </motion.a>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Partners Section ──────────────────────────────────────────── */

function PartnersSection() {
  const partners = ["Teltonika", "Concox", "Queclink", "Meitrack", "Grameenphone", "Robi", "Banglalink"];
  return (
    <section className="bg-[#050810] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <motion.div variants={fadeIn} className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Trusted by Industry Leaders</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-8">
            {partners.map((p) => (
              <motion.div key={p} whileHover={{ scale: 1.05 }} className="rounded-lg border border-white/5 bg-white/[0.02] px-8 py-4 text-lg font-semibold text-slate-500 transition-colors hover:border-teal-500/20 hover:text-teal-400">
                {p}
              </motion.div>
            ))}
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── CTA Section ───────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#050810] py-24">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-blue-500/20 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <AnimatedSection>
          <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400">
            <Icon path={ICONS.bolt} className="h-4 w-4" />
            Start tracking in 24 hours
          </motion.div>
          <motion.h2 variants={fadeInUp} className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl lg:text-5xl">
            Ready to Transform Your Fleet?
          </motion.h2>
          <motion.p variants={fadeInUp} className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Get a free demo and see how MotoLink can optimize your fleet operations with real-time tracking and smart analytics.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap justify-center gap-4">
            <motion.a href="#contact" whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 text-[16px] font-bold text-white shadow-xl shadow-teal-500/25 transition-all hover:shadow-2xl hover:shadow-teal-500/30">
              Get Free Demo
              <Icon path={ICONS.arrow} className="h-5 w-5" />
            </motion.a>
            <motion.a href={`tel:${CONTACT.hotline.replace(/[^+\d]/g, "")}`} whileHover={{ scale: 1.03 }} className="inline-flex h-14 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-[16px] font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10">
              <Icon path={ICONS.phone} className="h-5 w-5 text-teal-400" />
              {CONTACT.hotline}
            </motion.a>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Contact Section ───────────────────────────────────────────── */

function ContactSection() {
  return (
    <section id="contact" className="relative scroll-mt-20 bg-[#050810] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div variants={slideInLeft}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-400">
                Contact Us
              </div>
              <h2 className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">Start Tracking This Week</h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-slate-400">Get in touch with our team. We&apos;ll help you choose the right tracker and get your fleet on the map.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Sales", value: CONTACT.sales, href: `tel:${CONTACT.sales.replace(/[^+\d]/g, "")}`, icon: ICONS.phone },
                  { label: "Support", value: CONTACT.hotline, href: `tel:${CONTACT.hotline.replace(/[^+\d]/g, "")}`, icon: ICONS.phone },
                  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}`, icon: ICONS.mail },
                  { label: "Office", value: CONTACT.address, href: undefined, icon: ICONS.map },
                ].map((c) => (
                  <GlassCard key={c.label} className="!p-4">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                      <Icon path={c.icon} className="h-4 w-4" />
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{c.label}</div>
                    {c.href ? <a href={c.href} className="mt-1 block text-[14px] font-medium text-white hover:text-teal-400">{c.value}</a> : <div className="mt-1 text-[14px] font-medium text-white">{c.value}</div>}
                  </GlassCard>
                ))}
              </div>
            </motion.div>
            <motion.div variants={slideInRight}>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-8 backdrop-blur-xl">
                <h3 className="mb-6 text-xl font-bold text-white">Request a Free Demo</h3>
                <form className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input type="text" placeholder="Full Name" className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20" />
                    <input type="tel" placeholder="Phone Number" className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <input type="email" placeholder="Email Address" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20" />
                  <input type="text" placeholder="Company Name" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20" />
                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-slate-400 outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20">
                    <option value="">Fleet Size</option>
                    <option>1-5 vehicles</option>
                    <option>6-20 vehicles</option>
                    <option>21-50 vehicles</option>
                    <option>50+ vehicles</option>
                  </select>
                  <textarea rows={3} placeholder="Tell us about your needs..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20" />
                  <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-[15px] font-bold text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30">
                    Request Demo
                    <Icon path={ICONS.arrow} className="h-5 w-5" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#030508] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-slate-500">MotoLink GPS — Bangladesh&apos;s premier vehicle tracking platform. Real-time tracking, fleet management, and analytics for businesses of all sizes.</p>
            <div className="mt-6 flex gap-3">
              {["F", "L", "Y"].map((s) => (
                <motion.a key={s} href="#" whileHover={{ y: -3 }} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-teal-500/30 hover:text-teal-400">
                  {s}
                </motion.a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Platform</h4>
            <ul className="space-y-3 text-[14px]">
              {NAV_LINKS.map((l) => <li key={l.href}><a href={l.href} className="text-slate-500 transition-colors hover:text-teal-400">{l.label}</a></li>)}
              <li><Link href="/login" className="text-slate-500 transition-colors hover:text-teal-400">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Contact</h4>
            <ul className="space-y-3 text-[14px] text-slate-500">
              <li className="flex items-center gap-2"><Icon path={ICONS.phone} className="h-4 w-4 text-teal-500" /><a href={`tel:${CONTACT.hotline.replace(/[^+\d]/g, "")}`} className="hover:text-teal-400">{CONTACT.hotline}</a></li>
              <li className="flex items-center gap-2"><Icon path={ICONS.mail} className="h-4 w-4 text-teal-500" /><a href={`mailto:${CONTACT.email}`} className="hover:text-teal-400">{CONTACT.email}</a></li>
              <li className="flex items-start gap-2"><Icon path={ICONS.map} className="mt-0.5 h-4 w-4 text-teal-500" /><span>{CONTACT.address}</span></li>
            </ul>
            <div className="mt-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Certifications</div>
              <div className="mt-2 flex gap-2">
                {["BTRC", "ISO"].map((c) => <div key={c} className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-500">{c}</div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <span className="text-[13px] text-slate-600">© {new Date().getFullYear()} MotoLink GPS · Web Innovation</span>
          <div className="flex items-center gap-6 text-[13px] text-slate-600">
            <a href="#" className="hover:text-teal-400">Privacy</a>
            <a href="#" className="hover:text-teal-400">Terms</a>
            <span>Made in Bangladesh 🇧🇩</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */

export function LandingPageV2() {
  return (
    <div className="bg-[#050810] font-sans text-white antialiased">
      <Nav />
      <main>
        <Hero />
        <StatsSection />
        <FeaturesSection />
        <SolutionsSection />
        <ProductsSection />
        <PricingSection />
        <PartnersSection />
        <CTASection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
