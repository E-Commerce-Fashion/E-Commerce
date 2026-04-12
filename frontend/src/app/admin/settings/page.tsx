"use client";

import { useState } from "react";
import { Shield, Bell, Globe, Palette, Database, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const sections = [
  { id: "general", label: "General", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data & Backup", icon: Database },
];

export default function SettingsPage() {
  const [active, setActive] = useState("general");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success("Settings saved");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-slate-500 text-sm">Manage platform configuration and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Settings Nav */}
        <div className="admin-glass rounded-2xl p-3 h-fit">
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-sm font-medium text-left transition-all",
                  active === s.id
                    ? "bg-violet-600/15 text-violet-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <s.icon className={cn("w-4 h-4", active === s.id ? "text-violet-400" : "text-slate-500")} />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-3 admin-glass rounded-2xl p-6 space-y-6">
          {active === "general" && (
            <>
              <h3 className="font-bold text-white border-b border-white/5 pb-4">General Settings</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <SettingField label="Store Name" defaultValue="FashionForge" />
                <SettingField label="Store URL" defaultValue="https://fashionforge.in" />
                <SettingField label="Support Email" defaultValue="support@fashionforge.in" />
                <SettingField label="Currency" defaultValue="INR (₹)" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Store Description</label>
                <textarea
                  defaultValue="Discover premium fashion at FashionForge."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 resize-none"
                />
              </div>
            </>
          )}

          {active === "security" && (
            <>
              <h3 className="font-bold text-white border-b border-white/5 pb-4">Security Settings</h3>
              <div className="space-y-4">
                <ToggleSetting label="Require 2FA for Admin" description="All admin accounts must use two-factor authentication." defaultChecked />
                <ToggleSetting label="Session Timeout" description="Automatically log out after 30 minutes of inactivity." defaultChecked />
                <ToggleSetting label="IP Whitelisting" description="Restrict admin access to specific IP addresses." />
                <ToggleSetting label="Audit Logging" description="Log all admin actions for security review." defaultChecked />
              </div>
            </>
          )}

          {active === "notifications" && (
            <>
              <h3 className="font-bold text-white border-b border-white/5 pb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <ToggleSetting label="New Order Alerts" description="Get notified when a new order is placed." defaultChecked />
                <ToggleSetting label="Low Stock Warnings" description="Alert when product stock falls below 10 units." defaultChecked />
                <ToggleSetting label="Customer Registrations" description="Notify on new customer sign-ups." />
                <ToggleSetting label="Payment Failures" description="Instant alert on failed payment attempts." defaultChecked />
              </div>
            </>
          )}

          {active === "appearance" && (
            <>
              <h3 className="font-bold text-white border-b border-white/5 pb-4">Appearance</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Admin Theme</label>
                  <div className="flex gap-3">
                    {["Electric Dark", "Midnight Blue", "Slate Pro"].map((theme) => (
                      <button
                        key={theme}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                          theme === "Electric Dark"
                            ? "border-violet-500 bg-violet-600/15 text-violet-400"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Accent Color</label>
                  <div className="flex gap-3">
                    {["#8b5cf6", "#6366f1", "#ec4899", "#10b981", "#f97316"].map((color) => (
                      <button
                        key={color}
                        className="w-9 h-9 rounded-xl border-2 border-transparent hover:border-white/30 transition-all"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {active === "data" && (
            <>
              <h3 className="font-bold text-white border-b border-white/5 pb-4">Data & Backup</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-sm font-semibold text-white mb-1">Export Product Data</p>
                  <p className="text-xs text-slate-500 mb-3">Download all product records as CSV.</p>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                    Export CSV
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-sm font-semibold text-white mb-1">Export Order History</p>
                  <p className="text-xs text-slate-500 mb-3">Download all order records as CSV.</p>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                    Export CSV
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <p className="text-sm font-semibold text-rose-400 mb-1">Danger Zone</p>
                  <p className="text-xs text-slate-500 mb-3">These actions are irreversible. Proceed with caution.</p>
                  <button className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 hover:bg-rose-500/20 transition-colors">
                    Clear Cache
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <input
        defaultValue={defaultValue}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors"
      />
    </div>
  );
}

function ToggleSetting({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [enabled, setEnabled] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
          enabled ? "bg-violet-600" : "bg-white/10"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
          enabled ? "translate-x-6" : "translate-x-1"
        )} />
      </button>
    </div>
  );
}
