"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

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
      router.push("/login");
    }
  }, [profile, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060f0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-semibold text-white/50">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!profile || profile.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#060f0a] text-white flex">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>

        {/* Admin footer */}
        <footer className="border-t border-white/5 px-6 py-3">
          <p className="text-[10px] text-white/20 text-center font-medium">
            MangoDB Admin Panel &copy; {new Date().getFullYear()} — Built with
            Next.js + Supabase
          </p>
        </footer>
      </div>
    </div>
  );
}
