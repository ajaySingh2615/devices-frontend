"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HiHome,
  HiViewGrid,
  HiCollection,
  HiTag,
  HiClipboardList,
  HiPhotograph,
  HiUsers,
  HiChartBar,
  HiCog,
  HiMenu,
  HiX,
  HiLogout,
  HiChatAlt2,
  HiGift,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { clearTokens } from "@/lib/api";
import AdminProtection from "@/components/admin/AdminProtection";

const adminNavItems = [
  { href: "/admin", icon: HiHome, label: "Dashboard" },
  { href: "/admin/orders", icon: HiClipboardList, label: "Orders" },
  { href: "/admin/products", icon: HiViewGrid, label: "Products" },
  { href: "/admin/categories", icon: HiCollection, label: "Categories" },
  { href: "/admin/brands", icon: HiTag, label: "Brands" },
  { href: "/admin/coupons", icon: HiGift, label: "Coupons" },
  { href: "/admin/media", icon: HiPhotograph, label: "Media" },
  { href: "/admin/users", icon: HiUsers, label: "Users" },
  { href: "/admin/reviews", icon: HiChatAlt2, label: "Reviews" },
  { href: "/admin/analytics", icon: HiChartBar, label: "Analytics" },
  { href: "/admin/settings", icon: HiCog, label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearTokens();
    router.push("/auth/login");
  };

  return (
    <AdminProtection>
      <div className="min-h-screen bg-background-secondary overflow-x-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-200 ease-in-out
                      ${
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                      } lg:translate-x-0 lg:fixed`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DH</span>
                </div>
                <span className="text-xl font-bold font-display text-foreground">
                  Admin
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <HiX className="w-5 h-5" />
              </Button>
            </div>

            {/* Nav (scrollable) */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                                ${
                                  isActive
                                    ? "bg-primary text-white"
                                    : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
                                }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-error hover:bg-error/10"
                onClick={handleLogout}
              >
                <HiLogout className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main column (pushed on desktop) */}
        <div className="lg:ml-64 flex min-h-screen flex-col">
          {/* Top bar (sticky) */}
          <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <HiMenu className="w-5 h-5" />
              </Button>
              <div className="text-sm text-foreground-secondary">
                Welcome to DeviceHub Admin
              </div>
              <div /> {/* right spacer */}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 min-w-0 p-6">{children}</main>
        </div>
      </div>
    </AdminProtection>
  );
}
