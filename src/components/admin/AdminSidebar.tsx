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
    LogOut,
    Package,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Star,
    Ticket,
    Truck,
    Users,
    Warehouse,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Grid3X3 },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Delivery", href: "/admin/delivery", icon: Truck },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Returns", href: "/admin/returns", icon: ShoppingCart },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Banners", href: "/admin/banners", icon: Image },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Activity Logs", href: "/admin/logs", icon: FileText },
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
  const { logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#0F172A]">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-[#EEF2F7]">
        <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-md">
            <ShoppingBag className="w-5 h-5 text-black" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif-heading text-sm font-black text-[#0F172A] tracking-wide truncate">
                MangoDB
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                active
                  ? "bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-sm"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-transparent"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                  active
                    ? "text-amber-600"
                    : "text-[#94A3B8] group-hover:text-[#475569]"
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2.5 border-t border-[#EEF2F7]">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-white border-r border-[#EEF2F7] z-50 lg:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white border-r border-[#EEF2F7] sticky top-0 transition-all duration-300 shrink-0 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
