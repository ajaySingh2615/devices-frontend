"use client";

import { HiOutlineMail, HiPhone, HiLocationMarker } from "react-icons/hi";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

interface FooterSectionProps {
  scrollY: number;
}

export function FooterSection({ scrollY }: FooterSectionProps) {
  return (
    <footer className="home-footer">
      <div className="home-container">
        {/* Top strip */}
        <div className="border-b border-white/15 pb-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <div>
                <div className="text-xl font-bold font-display">DeviceHub</div>
                <div className="text-white/60 text-sm">
                  Refurbished • Guaranteed • Affordable
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Social href="https://facebook.com" label="Facebook">
                <FaFacebookF />
              </Social>
              <Social href="https://instagram.com" label="Instagram">
                <FaInstagram />
              </Social>
              <Social href="https://twitter.com" label="Twitter">
                <FaTwitter />
              </Social>
              <Social href="https://linkedin.com" label="LinkedIn">
                <FaLinkedinIn />
              </Social>
              <Social href="https://youtube.com" label="YouTube">
                <FaYoutube />
              </Social>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Brand + contact */}
          <div className="lg:col-span-4">
            <p className="text-white/70 mb-5 max-w-md">
              Premium refurbished electronics with warranty and hassle‑free
              support.
            </p>
            <ul className="space-y-3 text-white/80 text-sm">
              <li className="flex items-center gap-3">
                <span className="inline-flex w-9 h-9 rounded-lg bg-white/10 items-center justify-center">
                  <HiOutlineMail />
                </span>
                <a
                  href="mailto:support@devicehub.com"
                  className="hover:text-white"
                >
                  support@devicehub.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex w-9 h-9 rounded-lg bg-white/10 items-center justify-center">
                  <HiPhone />
                </span>
                <a href="tel:+911234567890" className="hover:text-white">
                  +91 12345 67890
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex w-9 h-9 rounded-lg bg-white/10 items-center justify-center">
                  <HiLocationMarker />
                </span>
                <span>New Delhi, India</span>
              </li>
            </ul>
          </div>

          {/* Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <LinkCol
              title="Company"
              items={["About Us", "Careers", "Press", "Blog", "Contact"]}
            />
            <LinkCol
              title="Support"
              items={[
                "Help Center",
                "Returns & Refunds",
                "Warranty",
                "Shipping",
                "Track Order",
              ]}
            />
            <LinkCol
              title="Shop"
              items={[
                "Laptops",
                "Smartphones",
                "Tablets",
                "Accessories",
                "Bestsellers",
              ]}
            />
            <LinkCol
              title="Legal"
              items={[
                "Terms of Service",
                "Privacy Policy",
                "Cookie Policy",
                "Refund Policy",
              ]}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/15">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/70">
              &copy; {new Date().getFullYear()} DeviceHub. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-white/70 text-sm">
              <a href="#" className="hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-white">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LinkCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80 mb-4">
        {title}
      </h3>
      <ul className="space-y-2 text-white/70 text-sm">
        {items.map((t) => (
          <li key={t}>
            <a
              href="#"
              className="hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <span className="h-[2px] w-0 bg-white/60 transition-all group-hover:w-3"></span>
              {t}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Social({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 ring-1 ring-white/15 flex items-center justify-center transition"
    >
      <span className="text-white">{children}</span>
    </a>
  );
}
