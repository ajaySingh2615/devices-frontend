"use client";

import { useState, useEffect, useRef } from "react";
import { RevealSection } from "./RevealSection";

interface KPISectionProps {
  scrollY: number;
}

export function KPISection({ scrollY }: KPISectionProps) {
  return (
    <RevealSection>
      <section className="kpi-strip">
        <div className="home-container kpi-grid">
          <KPI label="Happy Customers" valueTo={200000} suffix="+" />
          <KPI label="Devices Refurbished" valueTo={500000} suffix="+" />
          <KPI label="Cities Covered" valueTo={120} />
          <KPI label="Avg. Rating" valueTo={4.7} decimals={1} />
        </div>
      </section>
    </RevealSection>
  );
}

interface KPIProps {
  label: string;
  valueTo: number;
  suffix?: string;
  decimals?: number;
}

function KPI({ label, valueTo, suffix = "", decimals = 0 }: KPIProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const start = performance.now();
    const from = 0;
    const to = valueTo;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setValue(current);
      if (p < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, valueTo]);

  return (
    <div ref={ref} className="kpi-item">
      <div className="kpi-value">
        {value.toFixed(decimals)}
        {suffix}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
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
