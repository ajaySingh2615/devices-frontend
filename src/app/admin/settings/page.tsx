"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  HiGlobe,
  HiShieldCheck,
  HiDatabase,
  HiColorSwatch,
  HiMail,
  HiSave,
  HiRefresh,
  HiDownload,
  HiUpload,
} from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type ThemeMode = "light" | "dark" | "auto";
type Role = "USER" | "ADMIN";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  maintenanceMode: boolean;
  enableRegistration: boolean;
  enableGoogleAuth: boolean;
  enablePhoneAuth: boolean;
  defaultUserRole: Role;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  currency: string;
  timezone: string;
  dateFormat: string;
  theme: ThemeMode;
}

const DEFAULTS: SiteSettings = {
  siteName: "DeviceHub",
  siteDescription: "Refurbished Electronics Marketplace",
  siteUrl: "https://devicehub.com",
  adminEmail: "admin@devicehub.com",
  supportEmail: "support@devicehub.com",
  maintenanceMode: false,
  enableRegistration: true,
  enableGoogleAuth: true,
  enablePhoneAuth: true,
  defaultUserRole: "USER",
  maxFileUploadSize: 10,
  allowedFileTypes: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
  sessionTimeout: 30,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  currency: "INR",
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  theme: "light",
};

type TabId = "general" | "auth" | "files" | "notifications" | "appearance";
const TABS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "general", label: "General", icon: HiGlobe },
  { id: "auth", label: "Authentication", icon: HiShieldCheck },
  { id: "files", label: "File Management", icon: HiDatabase },
  { id: "notifications", label: "Notifications", icon: HiMail },
  { id: "appearance", label: "Appearance", icon: HiColorSwatch },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(false);
  const baselineRef = useRef<SiteSettings>(DEFAULTS);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---- Load + baseline ------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adminSettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
        baselineRef.current = { ...DEFAULTS, ...parsed };
      } else {
        baselineRef.current = DEFAULTS;
      }
    } catch (e) {
      console.error("Failed to load settings", e);
      toast.error("Failed to load settings");
    }
  }, []);

  // ---- Dirty state + beforeunload guard ------------------------------------
  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(baselineRef.current),
    [settings]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ---- Small helpers --------------------------------------------------------
  const updateSetting = <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K]
  ) => setSettings((prev) => ({ ...prev, [key]: value }));

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    try {
      const u = new URL(settings.siteUrl);
      if (!u.protocol.startsWith("http")) throw new Error();
    } catch {
      errors.siteUrl = "Enter a valid http(s) URL";
    }
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(settings.adminEmail)) errors.adminEmail = "Invalid email";
    if (!emailRe.test(settings.supportEmail))
      errors.supportEmail = "Invalid email";
    if (settings.maxFileUploadSize < 1)
      errors.maxFileUploadSize = "Must be at least 1MB";
    if (settings.sessionTimeout < 5) errors.sessionTimeout = "Min 5 minutes";
    return errors;
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---- Save / Reset / Backup / Restore -------------------------------------
  const saveSettings = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      // Persist to localStorage (replace with backend call when ready)
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      baselineRef.current = settings;
      toast.success("Settings saved");
      // (Optional) apply theme immediately
      applyTheme(settings.theme);
    } catch (e) {
      console.error("Save failed", e);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (!confirm("Reset all settings to default values?")) return;
    localStorage.removeItem("adminSettings");
    setSettings(DEFAULTS);
    baselineRef.current = DEFAULTS;
    applyTheme(DEFAULTS.theme);
    toast.success("Settings reset");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings_backup_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Settings exported");
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as SiteSettings;
      // quick sanity check
      if (!data.siteName || !data.siteUrl) throw new Error("Invalid file");
      setSettings((prev) => ({ ...prev, ...data }));
      toast.success("Settings imported (not saved yet)");
    } catch (e) {
      console.error(e);
      toast.error("Invalid settings file");
    }
  };

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.removeAttribute("data-theme");
    root.classList.remove("dark");
    if (mode === "dark") {
      root.classList.add("dark"); // use if you have dark styles
    } else if (mode === "light") {
      // light is default
    } else {
      // auto – rely on prefers-color-scheme
    }
    localStorage.setItem("theme", mode);
  };

  // ---- UI -------------------------------------------------------------------
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Settings
          </h1>
          <p className="text-foreground-secondary">
            Configure your platform settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportJson}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <HiUpload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={resetSettings}>
            <HiRefresh className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={loading || !dirty}>
            <HiSave className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : dirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Subheader: dirty hint */}
      {dirty && (
        <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm border border-warning/20">
          You have unsaved changes.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1 sticky top-4">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                        active
                          ? "bg-primary/10 text-primary border-r-2 border-primary"
                          : "text-foreground-secondary hover:bg-background-secondary"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* GENERAL */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiGlobe className="w-5 h-5 mr-2" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Site Name"
                    error={errors.siteName}
                    description="Shown in title, emails, and invoices."
                  >
                    <Input
                      value={settings.siteName}
                      onChange={(e) =>
                        updateSetting("siteName", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Site URL" error={errors.siteUrl}>
                    <Input
                      type="url"
                      value={settings.siteUrl}
                      onChange={(e) => updateSetting("siteUrl", e.target.value)}
                      placeholder="https://your-domain.com"
                    />
                  </Field>
                </div>

                <Field
                  label="Site Description"
                  description="Short tagline for SEO and meta tags."
                >
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface resize-none"
                    value={settings.siteDescription}
                    onChange={(e) =>
                      updateSetting("siteDescription", e.target.value)
                    }
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Admin Email" error={errors.adminEmail}>
                    <Input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) =>
                        updateSetting("adminEmail", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Support Email" error={errors.supportEmail}>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) =>
                        updateSetting("supportEmail", e.target.value)
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Currency">
                    <select
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                      value={settings.currency}
                      onChange={(e) =>
                        updateSetting("currency", e.target.value)
                      }
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </Field>

                  <Field label="Timezone">
                    <select
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                      value={settings.timezone}
                      onChange={(e) =>
                        updateSetting("timezone", e.target.value)
                      }
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </Field>

                  <Field label="Date Format">
                    <select
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                      value={settings.dateFormat}
                      onChange={(e) =>
                        updateSetting("dateFormat", e.target.value)
                      }
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </Field>
                </div>

                <Toggle
                  label="Enable Maintenance Mode"
                  checked={settings.maintenanceMode}
                  onChange={(v) => updateSetting("maintenanceMode", v)}
                />
              </CardContent>
            </Card>
          )}

          {/* AUTH */}
          {activeTab === "auth" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiShieldCheck className="w-5 h-5 mr-2" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Default User Role">
                    <select
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                      value={settings.defaultUserRole}
                      onChange={(e) =>
                        updateSetting("defaultUserRole", e.target.value as Role)
                      }
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </Field>

                  <Field
                    label="Session Timeout (minutes)"
                    error={errors.sessionTimeout}
                  >
                    <Input
                      type="number"
                      min={5}
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        updateSetting(
                          "sessionTimeout",
                          parseInt(e.target.value || "0", 10)
                        )
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Toggle
                    label="Enable User Registration"
                    checked={settings.enableRegistration}
                    onChange={(v) => updateSetting("enableRegistration", v)}
                  />
                  <Toggle
                    label="Enable Google Authentication"
                    checked={settings.enableGoogleAuth}
                    onChange={(v) => updateSetting("enableGoogleAuth", v)}
                  />
                  <Toggle
                    label="Enable Phone Authentication"
                    checked={settings.enablePhoneAuth}
                    onChange={(v) => updateSetting("enablePhoneAuth", v)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* FILES */}
          {activeTab === "files" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiDatabase className="w-5 h-5 mr-2" />
                  File Management Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Maximum File Upload Size (MB)"
                  error={errors.maxFileUploadSize}
                >
                  <Input
                    type="number"
                    min={1}
                    value={settings.maxFileUploadSize}
                    onChange={(e) =>
                      updateSetting(
                        "maxFileUploadSize",
                        parseInt(e.target.value || "0", 10)
                      )
                    }
                  />
                </Field>

                <Field
                  label="Allowed File Types"
                  description="Choose extensions permitted for uploads."
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      "jpg",
                      "jpeg",
                      "png",
                      "gif",
                      "pdf",
                      "doc",
                      "docx",
                      "txt",
                      "csv",
                      "xlsx",
                    ].map((type) => {
                      const checked = settings.allowedFileTypes.includes(type);
                      return (
                        <label
                          key={type}
                          className={`px-3 py-2 rounded-lg border cursor-pointer text-sm ${
                            checked
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateSetting("allowedFileTypes", [
                                  ...settings.allowedFileTypes,
                                  type,
                                ]);
                              } else {
                                updateSetting(
                                  "allowedFileTypes",
                                  settings.allowedFileTypes.filter(
                                    (t) => t !== type
                                  )
                                );
                              }
                            }}
                          />
                          .{type}
                        </label>
                      );
                    })}
                  </div>
                </Field>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiMail className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Toggle
                    label="Enable Email Notifications"
                    checked={settings.enableEmailNotifications}
                    onChange={(v) =>
                      updateSetting("enableEmailNotifications", v)
                    }
                  />
                  <Toggle
                    label="Enable SMS Notifications"
                    checked={settings.enableSMSNotifications}
                    onChange={(v) => updateSetting("enableSMSNotifications", v)}
                  />
                </div>

                <div className="p-4 bg-background-secondary rounded-lg">
                  <h4 className="font-medium mb-2">Notification Types</h4>
                  <p className="text-sm text-foreground-secondary">
                    Configure which events trigger notifications to users and
                    administrators.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <strong>User:</strong> Registration, Login, Password Reset
                    </div>
                    <div>
                      <strong>Order:</strong> Order Placed, Payment Confirmed,
                      Shipped
                    </div>
                    <div>
                      <strong>Admin:</strong> New User, Low Stock, System Alerts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* APPEARANCE */}
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiColorSwatch className="w-5 h-5 mr-2" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Theme">
                  <select
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                    value={settings.theme}
                    onChange={(e) =>
                      updateSetting("theme", e.target.value as ThemeMode)
                    }
                    onBlur={() => applyTheme(settings.theme)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </Field>

                <div className="p-4 bg-background-secondary rounded-lg">
                  <h4 className="font-medium mb-2">Color Scheme</h4>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Using your global theme tokens:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Swatch name="Primary" className="bg-primary" />
                    <Swatch name="Secondary" className="bg-secondary" />
                    <Swatch name="Accent" className="bg-accent" />
                    <Swatch name="Warning" className="bg-warning" />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Advanced theme customization can hook
                    into your CSS tokens (e.g., setting <code>data-theme</code>{" "}
                    on <code>html</code>) when you’re ready.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny presentational helpers ---------- */
function Field({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {children}
      {description && (
        <p className="text-xs text-foreground-secondary mt-1">{description}</p>
      )}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg ${
        checked ? "border-secondary bg-secondary/10" : "border-border"
      }`}
      aria-pressed={checked}
      role="switch"
    >
      <span className="text-sm">{label}</span>
      <span
        className={`inline-flex h-5 w-10 rounded-full transition ${
          checked ? "bg-secondary" : "bg-border-dark"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 bg-white rounded-full transform transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="text-center">
      <div className={`w-12 h-12 rounded-lg mx-auto mb-2 ${className}`} />
      <span className="text-sm">{name}</span>
    </div>
  );
}
