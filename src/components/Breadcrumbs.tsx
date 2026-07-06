// ===========================================
// Breadcrumbs — Reusable navigation component
// ===========================================
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card/80 border border-border px-4 py-2.5 rounded-xl w-fit shadow-sm ${className}`}>
      <Link href="/" className="hover:text-[#fbbf24] transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 opacity-50" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[#fbbf24] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-hero-text bg-[#fbbf24]/10 px-2 py-0.5 rounded text-[#fbbf24]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
