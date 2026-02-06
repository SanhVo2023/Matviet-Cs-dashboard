"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase.auth]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* User Profile */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
            <User className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <p className="text-sm text-slate-400">Your account information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Email
            </label>
            <p className="text-white">{user?.email || "Loading..."}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              User ID
            </label>
            <p className="text-slate-300 text-sm font-mono">{user?.id || "-"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Last Sign In
            </label>
            <p className="text-slate-300">
              {user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString("vi-VN")
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
            <Database className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">System</h2>
            <p className="text-sm text-slate-400">Database and sync information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Database</p>
            <p className="text-white font-medium">Supabase PostgreSQL</p>
            <p className="text-xs text-slate-500 mt-1">futubpmmetfqppedhhph</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">NPS Sync</p>
            <p className="text-white font-medium">Daily at 6:00 AM (GMT+7)</p>
            <p className="text-xs text-slate-500 mt-1">Via Edge Function cron</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://supabase.com/dashboard/project/futubpmmetfqppedhhph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors"
          >
            <Database className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Supabase Dashboard</p>
              <p className="text-sm text-slate-400">Manage database directly</p>
            </div>
          </a>
          <a
            href="https://futubpmmetfqppedhhph.supabase.co/functions/v1/sync-nps"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-colors"
          >
            <Bell className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="font-medium text-white">Manual NPS Sync</p>
              <p className="text-sm text-slate-400">Trigger NPS import now</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
