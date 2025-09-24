"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import toast from "react-hot-toast";
import { newsletterApi } from "@/lib/api";
import { RevealSection } from "./RevealSection";
import { motion } from "framer-motion";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid =
      /^(?:[a-zA-Z0-9_'^&+%`{}~!$*-]+(?:\.[a-zA-Z0-9_'^&+%`{}~!$*-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
        email.trim()
      );
    if (!valid) return toast.error("Please enter a valid email address.");
    try {
      setLoading(true);
      await newsletterApi.subscribe(email.trim(), "homepage");
      toast.success("Subscribed! You'll hear from us soon.");
      setEmail("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <RevealSection>
      <section className="home-newsletter">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold font-display !text-white mb-4">
            Stay Updated with Latest Deals
          </h2>
          <p className="text-white/80 mb-8">
            Subscribe to our newsletter and be the first to know about new
            arrivals and exclusive offers
          </p>

          <motion.form
            onSubmit={onSubmit}
            className="flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 px-4 rounded-lg border border-border bg-white text-foreground placeholder-foreground-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-5 rounded-lg bg-white text-primary hover:bg-gray-100 shrink-0"
            >
              {loading ? "Subscribing…" : "Subscribe"}
            </Button>
          </motion.form>
        </div>
      </section>
    </RevealSection>
  );
}
