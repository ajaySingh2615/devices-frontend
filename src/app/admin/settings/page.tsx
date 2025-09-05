"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiCog,
  HiMail,
  HiGlobe,
  HiShieldCheck,
  HiDatabase,
  HiColorSwatch,
  HiSave,
  HiRefresh,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

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
  defaultUserRole: "USER" | "ADMIN";
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  currency: string;
  timezone: string;
  dateFormat: string;
  theme: "light" | "dark" | "auto";
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
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
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "auth" | "files" | "notifications" | "appearance"
  >("general");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, load settings from backend
      // const data = await adminApi.getSettings();
      // setSettings(data);

      // For now, using localStorage as demo
      const savedSettings = localStorage.getItem("adminSettings");
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, save to backend
      // await adminApi.updateSettings(settings);

      // For now, using localStorage as demo
      localStorage.setItem("adminSettings", JSON.stringify(settings));

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      localStorage.removeItem("adminSettings");
      window.location.reload();
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "general", label: "General", icon: HiGlobe },
    { id: "auth", label: "Authentication", icon: HiShieldCheck },
    { id: "files", label: "File Management", icon: HiDatabase },
    { id: "notifications", label: "Notifications", icon: HiMail },
    { id: "appearance", label: "Appearance", icon: HiColorSwatch },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Settings
          </h1>
          <p className="text-foreground-secondary">
            Configure your platform settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={resetSettings} variant="outline">
            <HiRefresh className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            <HiSave className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary/10 text-primary border-r-2 border-primary"
                          : "text-foreground-secondary hover:bg-background-secondary"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
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
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Site Name
                    </label>
                    <Input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) =>
                        updateSetting("siteName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Site URL
                    </label>
                    <Input
                      type="url"
                      value={settings.siteUrl}
                      onChange={(e) => updateSetting("siteUrl", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) =>
                      updateSetting("siteDescription", e.target.value)
                    }
                    rows={3}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Admin Email
                    </label>
                    <Input
                      type="email"
                      value={settings.adminEmail}
                      onChange={(e) =>
                        updateSetting("adminEmail", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Support Email
                    </label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) =>
                        updateSetting("supportEmail", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) =>
                        updateSetting("currency", e.target.value)
                      }
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) =>
                        updateSetting("timezone", e.target.value)
                      }
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) =>
                        updateSetting("dateFormat", e.target.value)
                      }
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      updateSetting("maintenanceMode", e.target.checked)
                    }
                    className="rounded border-border focus:ring-primary"
                  />
                  <label
                    htmlFor="maintenanceMode"
                    className="text-sm font-medium"
                  >
                    Enable Maintenance Mode
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Default User Role
                    </label>
                    <select
                      value={settings.defaultUserRole}
                      onChange={(e) =>
                        updateSetting("defaultUserRole", e.target.value)
                      }
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Session Timeout (minutes)
                    </label>
                    <Input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        updateSetting(
                          "sessionTimeout",
                          parseInt(e.target.value)
                        )
                      }
                      min="5"
                      max="1440"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableRegistration"
                      checked={settings.enableRegistration}
                      onChange={(e) =>
                        updateSetting("enableRegistration", e.target.checked)
                      }
                      className="rounded border-border focus:ring-primary"
                    />
                    <label
                      htmlFor="enableRegistration"
                      className="text-sm font-medium"
                    >
                      Enable User Registration
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableGoogleAuth"
                      checked={settings.enableGoogleAuth}
                      onChange={(e) =>
                        updateSetting("enableGoogleAuth", e.target.checked)
                      }
                      className="rounded border-border focus:ring-primary"
                    />
                    <label
                      htmlFor="enableGoogleAuth"
                      className="text-sm font-medium"
                    >
                      Enable Google Authentication
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enablePhoneAuth"
                      checked={settings.enablePhoneAuth}
                      onChange={(e) =>
                        updateSetting("enablePhoneAuth", e.target.checked)
                      }
                      className="rounded border-border focus:ring-primary"
                    />
                    <label
                      htmlFor="enablePhoneAuth"
                      className="text-sm font-medium"
                    >
                      Enable Phone Authentication
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "files" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiDatabase className="w-5 h-5 mr-2" />
                  File Management Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maximum File Upload Size (MB)
                  </label>
                  <Input
                    type="number"
                    value={settings.maxFileUploadSize}
                    onChange={(e) =>
                      updateSetting(
                        "maxFileUploadSize",
                        parseInt(e.target.value)
                      )
                    }
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Allowed File Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`filetype-${type}`}
                          checked={settings.allowedFileTypes.includes(type)}
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
                          className="rounded border-border focus:ring-primary"
                        />
                        <label htmlFor={`filetype-${type}`} className="text-sm">
                          .{type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiMail className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableEmailNotifications"
                      checked={settings.enableEmailNotifications}
                      onChange={(e) =>
                        updateSetting(
                          "enableEmailNotifications",
                          e.target.checked
                        )
                      }
                      className="rounded border-border focus:ring-primary"
                    />
                    <label
                      htmlFor="enableEmailNotifications"
                      className="text-sm font-medium"
                    >
                      Enable Email Notifications
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableSMSNotifications"
                      checked={settings.enableSMSNotifications}
                      onChange={(e) =>
                        updateSetting(
                          "enableSMSNotifications",
                          e.target.checked
                        )
                      }
                      className="rounded border-border focus:ring-primary"
                    />
                    <label
                      htmlFor="enableSMSNotifications"
                      className="text-sm font-medium"
                    >
                      Enable SMS Notifications
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-background-secondary rounded-lg">
                  <h4 className="font-medium mb-2">Notification Types</h4>
                  <p className="text-sm text-foreground-secondary">
                    Configure which events trigger notifications to users and
                    administrators.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">
                      <strong>User Events:</strong> Registration, Login,
                      Password Reset
                    </div>
                    <div className="text-sm">
                      <strong>Order Events:</strong> Order Placed, Payment
                      Confirmed, Shipped
                    </div>
                    <div className="text-sm">
                      <strong>Admin Events:</strong> New User, Low Stock, System
                      Alerts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HiColorSwatch className="w-5 h-5 mr-2" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSetting("theme", e.target.value)}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div className="p-4 bg-background-secondary rounded-lg">
                  <h4 className="font-medium mb-2">Color Scheme</h4>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Current theme uses the following color palette:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-2"></div>
                      <span className="text-sm">Primary</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-2"></div>
                      <span className="text-sm">Secondary</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-2"></div>
                      <span className="text-sm">Accent</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-warning rounded-lg mx-auto mb-2"></div>
                      <span className="text-sm">Warning</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Theme customization and advanced
                    branding options will be available in future updates.
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
