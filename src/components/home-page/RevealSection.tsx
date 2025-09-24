"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface RevealSectionProps {
  children: React.ReactNode;
  once?: boolean;
  amount?: number; // 0..1 in-view amount
  delay?: number; // seconds
}

export function RevealSection({
  children,
  once = true,
  amount = 0.25,
  delay = 0,
}: RevealSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <motion.div
      ref={ref as any}
      className={`reveal-wrap ${inView ? "in-view" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- tiny in-view hook (no dependencies) ---------- */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15, ...options }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [options, inView]);

  return { ref, inView };
}
