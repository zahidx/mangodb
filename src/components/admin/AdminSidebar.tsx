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
    Shield,
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

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: Grid3X3 },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Delivery", href: "/admin/delivery", icon: Truck },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Returns", href: "/admin/returns", icon: ShoppingCart },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { label: "Banners", href: "/admin/banners", icon: Image },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Abandoned Carts", href: "/admin/abandoned-carts", icon: RefreshCw },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Activity Logs", href: "/admin/logs", icon: FileText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
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
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-slate-100">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 min-w-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <ShoppingBag className="w-4 h-4 text-black" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 tracking-tight">
                MangoDB
              </span>
              <span className="text-xs lg:text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Admin
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={collapsed ? onToggle : onMobileClose}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed && (
              <div className="px-2 mb-1.5">
                <span className="text-xs lg:text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                    className={`flex items-center gap-3 rounded-lg transition-all duration-150 ${
                      collapsed ? "justify-center px-2 py-2" : "px-3 py-2.5 sm:py-2"
                    } text-sm sm:text-sm lg:text-sm ${
                      active
                        ? "bg-amber-50 text-amber-700 font-semibold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      className={`shrink-0 ${
                        collapsed ? "w-5 h-5" : "w-5 sm:w-4.5 h-5 sm:h-4.5"
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {!collapsed && (
                      <span className="truncate text-sm sm:text-sm">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom logout */}
      {!collapsed && (
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Shield className="w-4.5 h-4.5" strokeWidth={2} />
            <span className="truncate font-medium text-sm">Logout</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-70 bg-white border-r border-slate-200 z-50 lg:hidden transition-transform duration-300 shadow-2xl shadow-black/5 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white border-r border-slate-200/80 sticky top-0 transition-all duration-300 shrink-0 ${
          collapsed ? "w-17" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
