"use client";

import { useState, useEffect, useRef } from "react";

interface RevealSectionProps {
  children: React.ReactNode;
}

export function RevealSection({ children }: RevealSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal-wrap ${inView ? "in-view" : ""}`}>
      {children}
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
