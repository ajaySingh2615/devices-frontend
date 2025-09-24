"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  HiUserGroup,
  HiRefresh,
  HiLocationMarker,
  HiStar,
} from "react-icons/hi";

/**
 * KPISection – polished, production‑ready stats section
 * - Elegant animated background (grid, glows, gradient orbs)
 * - Staggered reveal with spring; count‑up numbers (prefers‑reduced‑motion aware)
 * - Subtle hover parallax + magnetic cursor tilt
 * - Accessible, responsive, and themable with Tailwind
 *
 * Requirements: tailwindcss, framer-motion, react-icons
 * Usage: <KPISection />
 */

export default function KPISection({ scrollY }: { scrollY?: number }) {
  const items = useMemo<KPIItem[]>(
    () => [
      {
        icon: <HiUserGroup className="w-6 h-6" />,
        label: "Happy Customers",
        valueTo: 200000,
        suffix: "+",
      },
      {
        icon: <HiRefresh className="w-6 h-6" />,
        label: "Devices Refurbished",
        valueTo: 500000,
        suffix: "+",
      },
      {
        icon: <HiLocationMarker className="w-6 h-6" />,
        label: "Cities Covered",
        valueTo: 120,
      },
      {
        icon: <HiStar className="w-6 h-6" />,
        label: "Avg. Rating",
        valueTo: 4.7,
        decimals: 1,
      },
    ],
    []
  );

  return (
    <section className="relative overflow-hidden py-14 md:py-16">
      {/* BACKGROUND LAYERS */}
      <AnimatedBackground />

      <div className="home-container relative">
        {/* Section header (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          className="mx-auto mb-8 md:mb-10 max-w-2xl text-center"
        >
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-display">
            Numbers that prove our impact
          </h2>
          <p className="mt-2 text-sm md:text-base text-foreground-secondary">
            Trust, scale, and consistency—measured where it matters.
          </p>
        </motion.div>

        {/* KPI GRID */}
        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerStagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          aria-label="Key performance indicators"
        >
          {items.map((it, i) => (
            <li key={i}>
              <KPICard {...it} index={i} />
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

// Also provide a named export for compatibility with existing imports
export { KPISection };

/* ---------------------------- Subcomponents ---------------------------- */

type KPIItem = {
  icon: React.ReactNode;
  label: string;
  valueTo: number;
  suffix?: string;
  decimals?: number;
};

function KPICard({
  icon,
  label,
  valueTo,
  suffix = "",
  decimals = 0,
  index = 0,
}: KPIItem & { index?: number }) {
  const [ref, inView] = useInViewOnce({
    threshold: 0.3,
    rootMargin: "0px 0px -10% 0px",
  });
  const prefersReduced = useReducedMotion();
  const [value, setValue] = useState(0);

  // Count up animation
  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) {
      setValue(valueTo);
      return;
    }
    const duration = 1000; // ms
    const start = performance.now();
    const from = 0;
    const to = valueTo;

    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // fast-out, slow-in cubic
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setValue(current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, prefersReduced, valueTo]);

  // Magnetic hover (parallax tilt)
  const cardRef = useRef<HTMLDivElement | null>(null);
  useMagneticTilt(cardRef);

  return (
    <motion.div
      ref={cardRef}
      variants={itemSlide(index)}
      className="relative overflow-hidden rounded-2xl border border-border/70 bg-white/80 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md transition-all will-change-transform"
    >
      {/* hover shimmer */}
      <div className="pointer-events-none absolute -inset-x-12 -top-10 h-24 bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* subtle inner gradient ring */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40 dark:ring-white/10" />

      <div ref={ref} className="group relative p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-primary/15 blur-md" />
            <div className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-sky-100 text-primary dark:from-primary/20 dark:to-primary/10">
              {icon}
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[13px] md:text-sm text-foreground-secondary">
              {label}
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tight text-foreground tabular-nums font-display">
              {value.toFixed(decimals)}
              {suffix}
            </div>
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-4 h-1.5 w-full rounded-full bg-foreground-muted/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: inView ? "100%" : 0 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400"
          />
        </div>
      </div>

      {/* bottom glow on hover */}
      <div className="pointer-events-none absolute bottom-[-40%] left-1/2 -translate-x-1/2 h-40 w-[120%] rounded-[50%] bg-primary/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

/* ------------------------------ Animations ----------------------------- */

const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

function itemSlide(i: number) {
  const dir = i % 2 === 0 ? 1 : -1;
  return {
    hidden: { opacity: 0, y: 16, x: 8 * dir },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { type: "spring", stiffness: 120, damping: 14 },
    },
  } as const;
}

/* --------------------------- Intersection Hook ------------------------- */
function useInViewOnce(
  opts?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
          break;
        }
      }
    }, opts ?? { threshold: 0.25 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [opts, inView]);

  return [ref, inView];
}

/* ----------------------------- Magnetic Tilt --------------------------- */
function useMagneticTilt(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      const rotX = dy * -4; // tilt up/down
      const rotY = dx * 6; // tilt left/right
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/* --------------------------- Animated Background ----------------------- */
function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* soft gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-sky-50/60 to-white dark:from-transparent dark:via-sky-900/10 dark:to-transparent" />

      {/* radial orbs */}
      <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />

      {/* animated grid overlay */}
      <div className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-foreground/20"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* sheen sweep */}
      <div className="absolute -inset-x-40 -top-20 h-24 skew-y-3 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 animate-[sheen_6s_linear_infinite]" />
      <style jsx>{`
        @keyframes sheen {
          0% {
            transform: translateX(-30%) skewY(3deg);
          }
          100% {
            transform: translateX(30%) skewY(3deg);
          }
        }
      `}</style>
    </div>
  );
}
