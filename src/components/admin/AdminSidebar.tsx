"use client";

import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  ChevronLeft,
  CreditCard,
  FileText,
  Grid3X3,
  Image,
  LayoutDashboard,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Ticket,
  Truck,
  Users,
  Warehouse,
  X,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, color: "text-blue-500" },
      { label: "Reports", href: "/admin/reports", icon: BarChart3, color: "text-indigo-500" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package, color: "text-emerald-500" },
      { label: "Categories", href: "/admin/categories", icon: Grid3X3, color: "text-teal-500" },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse, color: "text-cyan-500" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart, color: "text-amber-500" },
      { label: "Customers", href: "/admin/customers", icon: Users, color: "text-purple-500" },
      { label: "Delivery", href: "/admin/delivery", icon: Truck, color: "text-sky-500" },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, color: "text-rose-500" },
      { label: "Returns", href: "/admin/returns", icon: ShoppingCart, color: "text-orange-500" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Coupons", href: "/admin/coupons", icon: Ticket, color: "text-violet-500" },
      { label: "Banners", href: "/admin/banners", icon: Image, color: "text-fuchsia-500" },
      { label: "Reviews", href: "/admin/reviews", icon: Star, color: "text-yellow-500" },
      { label: "Abandoned Carts", href: "/admin/abandoned-carts", icon: RefreshCw, color: "text-red-500" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Activity Logs", href: "/admin/logs", icon: FileText, color: "text-slate-500" },
      { label: "Settings", href: "/admin/settings", icon: Settings, color: "text-slate-600" },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-750 font-sans select-none">
      {/* Logo Area */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-3 min-w-0 group"
        >
          <div className="w-8.5 h-8.5 rounded bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10">
            <ShoppingBag className="w-4.5 h-4.5 text-black" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-800 tracking-tight uppercase">
                MangoDB
              </span>
              <span className="text-[9px] font-bold text-[#20BA5A] uppercase tracking-widest leading-none mt-0.5">
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden w-8 h-8 rounded-full border border-slate-200/60 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer shadow-xs"
          title="Close Sidebar"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-5 pr-2 pl-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.label}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 transition-all duration-300 ease-in-out ${
                      collapsed 
                        ? "justify-center p-2.5 mx-1 rounded-md" 
                        : "px-3 py-3 sm:py-2.5 rounded-r-md border-l-2 hover:translate-x-1"
                    } text-sm font-bold ${
                      active
                        ? collapsed 
                          ? "bg-emerald-50 text-emerald-600 font-bold"
                          : "bg-emerald-50/40 text-emerald-700 font-black border-emerald-500"
                        : collapsed
                          ? "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <Icon
                      className={`shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-110 ${
                        collapsed ? "w-5 h-5" : "w-4.5 h-4.5"
                      } ${item.color}`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {!collapsed && (
                      <span className="truncate transition-colors duration-200">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile Widget */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/30 shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-black text-xs font-black shadow-sm" title={profile?.full_name || "Admin"}>
              {getInitials(profile?.full_name || "Admin")}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-black text-xs font-black shadow-sm shrink-0">
                {getInitials(profile?.full_name || "Admin")}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {profile?.full_name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {profile?.email || "admin@mangodb.com"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ease-in-out"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 lg:hidden transition-transform duration-300 ease-in-out shadow-2xl shadow-black/5 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white border-r border-slate-200 sticky top-0 transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
