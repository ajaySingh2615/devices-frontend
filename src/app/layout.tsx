import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navigation from "@/components/layout/Navigation";
import { VerificationBanner } from "@/components/layout/VerificationBanner";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";
import "./home.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "DeviceHub - Refurbished Electronics",
  description:
    "Premium refurbished devices at unbeatable prices. Smartphones, laptops, tablets and more with warranty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navigation />
          <VerificationBanner />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--color-surface)",
                color: "var(--color-foreground)",
                border: "1px solid var(--color-border)",
              },
              success: {
                iconTheme: {
                  primary: "var(--color-success)",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--color-error)",
                  secondary: "white",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
