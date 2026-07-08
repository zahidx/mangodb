"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!profile || profile.role !== "admin")) {
      router.push("/admin-login");
    }
  }, [profile, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 animate-pulse">
              <ShoppingBag className="w-8 h-8 text-black" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-black text-slate-700 tracking-tight">
              Loading Admin Panel
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Verifying credentials & preparing your dashboard...
            </p>
          </div>
          {/* Animated dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-amber-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!profile || profile.role !== "admin") {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50/80 to-white text-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>

        {/* Admin footer */}
        <footer className="border-t border-slate-200/60 px-6 py-3 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-medium">
              MangoDB Admin Panel &copy; {new Date().getFullYear()}
            </p>
            <p className="text-[10px] text-slate-300 font-medium">
              Built with Next.js + Supabase
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
