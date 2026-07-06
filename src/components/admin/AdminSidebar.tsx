"use client";

import { useAuth } from "@/context/AuthContext";
import {
    BarChart3,
    ChevronDown,
    ChevronLeft,
    CreditCard,
    FileText,
    Grid3X3,
    Image,
    Layers,
    LayoutDashboard,
    Package,
    PieChart,
    RefreshCw,
    Settings,
    Shield,
    ShoppingBag,
    ShoppingCart,
    Star,
    Store,
    Tag,
    Ticket,
    Truck,
    Users,
    Warehouse,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_GROUPS = [
  {
    group: "Overview",
    icon: PieChart,
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    group: "Catalog",
    icon: Store,
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: Grid3X3 },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
    ],
  },
  {
    group: "Sales",
    icon: Tag,
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Delivery", href: "/admin/delivery", icon: Truck },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Returns", href: "/admin/returns", icon: ShoppingCart },
    ],
  },
  {
    group: "Marketing",
    icon: Layers,
    items: [
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { label: "Banners", href: "/admin/banners", icon: Image },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Abandoned Carts", href: "/admin/abandoned-carts", icon: RefreshCw },
    ],
  },
  {
    group: "System",
    icon: Shield,
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: false,
    Catalog: false,
    Sales: false,
    Marketing: false,
    System: false,
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleNavClick = (href: string) => {
    onMobileClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 min-w-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag className="w-5 h-5 text-black" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-slate-800 tracking-tight truncate">
                MangoDB
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.15em]">
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-1">
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.group] !== false;
          const GroupIcon = group.icon;

          return (
            <div key={group.group} className="flex flex-col space-y-1.5">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex items-center justify-between px-2 py-1 cursor-pointer group/header transition-colors w-full focus:outline-none"
                >
                  <div className="flex items-center gap-2.5">
                    <GroupIcon className={`w-[15px] h-[15px] transition-colors ${isExpanded ? 'text-slate-700' : 'text-slate-400 group-hover/header:text-slate-600'}`} strokeWidth={2} />
                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isExpanded ? 'text-slate-700' : 'text-slate-500 group-hover/header:text-slate-700'}`}>
                      {group.group}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'text-slate-500 rotate-0' : 'text-slate-300 -rotate-90'}`}
                  />
                </button>
              )}
              
              <div 
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  !collapsed && !isExpanded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                }`}
              >
                <div className="overflow-hidden flex flex-col space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onClick={() => handleNavClick(item.href)}
                        title={collapsed ? item.label : undefined}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-200 ${
                          active
                            ? "bg-amber-50/80 text-amber-700 font-bold shadow-sm ring-1 ring-amber-200"
                            : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/80"
                        } ${collapsed ? "justify-center px-2" : ""}`}
                      >
                        <div
                          className={`w-[18px] h-[18px] shrink-0 flex items-center justify-center transition-colors ${
                            active ? "text-amber-600" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        {!collapsed && (
                          <span className="truncate tracking-wide">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

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
        className={`fixed top-0 left-0 h-full w-[280px] bg-white border-r border-slate-200 z-50 lg:hidden transition-transform duration-300 shadow-2xl shadow-black/5 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white border-r border-slate-200/80 sticky top-0 transition-all duration-300 shrink-0 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
