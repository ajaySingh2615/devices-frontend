"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HiHome,
  HiViewGrid,
  HiCollection,
  HiTag,
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
      <div className="min-h-screen bg-background-secondary flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black opacity-50"></div>
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
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

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
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
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Top bar */}
          <header className="bg-surface border-b border-border px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <HiMenu className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-foreground-secondary">
                  Welcome to DeviceHub Admin
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AdminProtection>
  );
}
