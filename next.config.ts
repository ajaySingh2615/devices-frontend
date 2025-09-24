import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better development experience
  experimental: {
    optimizePackageImports: ["react-icons", "react-hook-form"],
    staleTimes: {
      dynamic: 30, // cache for 30 seconds
    },
  },

  // Handle external API calls
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },

  // Add security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Handle images and static assets
  images: {
    domains: ["localhost", "picsum.photos", "res.cloudinary.com"],
    dangerouslyAllowSVG: true,
  },

  // Bundle optimization
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
