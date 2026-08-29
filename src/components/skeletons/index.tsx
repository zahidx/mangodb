// ===========================================
// Reusable Skeleton Components (Dark & Light Mode)
// ===========================================

/** Base shimmer block */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-white/5 dark:via-white/10 dark:to-white/5 rounded-xl bg-[length:200%_100%] animate-[shimmer_1.8s_ease-in-out_infinite] ${className}`}
    />
  );
}

/** Product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col justify-between">
      {/* Image placeholder */}
      <SkeletonBlock className="aspect-square w-full rounded-none" />
      {/* Content */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="pt-2 border-t border-border/50 space-y-2.5">
          <SkeletonBlock className="h-5 w-20" />
          <div className="grid grid-cols-2 gap-1.5">
            <SkeletonBlock className="h-8 w-full rounded-xl" />
            <SkeletonBlock className="h-8 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Product grid skeleton (for products page) */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Product detail page skeleton */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <SkeletonBlock className="aspect-square w-full rounded-3xl" />
        {/* Details */}
        <div className="space-y-4">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-8 w-3/4" />
          <SkeletonBlock className="h-5 w-32" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-20 rounded-xl" />
            <SkeletonBlock className="h-10 w-20 rounded-xl" />
            <SkeletonBlock className="h-10 w-20 rounded-xl" />
          </div>
          <SkeletonBlock className="h-24 w-full rounded-2xl" />
          <div className="space-y-2 pt-4">
            <SkeletonBlock className="h-12 w-full rounded-xl" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
      {/* Reviews skeleton */}
      <div className="mt-16 space-y-4">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="h-32 w-full rounded-2xl" />
        <SkeletonBlock className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Cart page skeleton */
export function CartSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SkeletonBlock className="h-8 w-32 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-card rounded-2xl border border-border">
            <SkeletonBlock className="w-20 h-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-1/4" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
            <SkeletonBlock className="w-24 h-10 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Checkout page skeleton */
export function CheckoutSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SkeletonBlock className="h-8 w-40 mb-8" />
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-24 w-full rounded-xl" />
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-10 w-full rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dashboard order list skeleton */
export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dashboard stats card skeleton */
export function StatsCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="h-8 w-16" />
      <SkeletonBlock className="h-3 w-24" />
    </div>
  );
}

/** Banner / carousel skeleton */
export function BannerSkeleton() {
  return (
    <SkeletonBlock className="w-full h-[200px] sm:h-[300px] lg:h-[400px] rounded-3xl" />
  );
}

// ===========================================
// Premium Homepage Skeletons
// ===========================================

/** Hero banner skeleton — full-width premium shimmer */
export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full h-[460px] sm:h-[540px] md:h-[620px] overflow-hidden bg-neutral-950">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
      {/* Decorative skeleton shapes */}
      <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 sm:px-10 md:px-14 pb-12 sm:pb-16 space-y-4">
        <SkeletonBlock className="h-6 w-48 rounded-full" />
        <SkeletonBlock className="h-10 sm:h-14 md:h-16 w-3/4 max-w-xl" />
        <SkeletonBlock className="h-4 sm:h-5 w-1/2 max-w-md" />
        <div className="flex gap-3 pt-4">
          <SkeletonBlock className="h-12 w-36 rounded-xl" />
          <SkeletonBlock className="h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Promo banners skeleton — two cards side by side */
export function PromoBannersSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card border border-border flex flex-col sm:flex-row h-auto sm:h-52">
            <div className="p-5 sm:p-6 space-y-3 flex-1">
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-5 w-3/4" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-1/2" />
            </div>
            <SkeletonBlock className="w-full sm:w-48 h-40 sm:h-full shrink-0 rounded-none" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Featured products skeleton — horizontal scrollable row of cards */
export function FeaturedProductsSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
      {/* Section header skeleton */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-6 w-48" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-9 rounded-full" />
          <SkeletonBlock className="h-9 w-9 rounded-full" />
        </div>
      </div>
      {/* Scrollable row */}
      <div className="flex gap-4 sm:gap-5 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-card rounded-2xl border border-border overflow-hidden flex flex-col justify-between"
          >
            <SkeletonBlock className="h-44 sm:h-48 w-full rounded-none" />
            <div className="p-3.5 sm:p-4 space-y-2.5">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-1/2" />
              <div className="pt-2 border-t border-border/50 space-y-2">
                <SkeletonBlock className="h-5 w-20" />
                <div className="grid grid-cols-2 gap-1.5">
                  <SkeletonBlock className="h-8 rounded-xl" />
                  <SkeletonBlock className="h-8 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Full home page skeleton — mirrors the actual page structure */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <HeroBannerSkeleton />
      <PromoBannersSkeleton />
      <FeaturedProductsSkeleton />
      {/* Category tabs skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBlock key={i} className="h-12 w-32 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
      {/* Products grid skeleton */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-6 w-56" />
          </div>
          <SkeletonBlock className="h-3 w-24" />
        </div>
        <ProductGridSkeleton count={10} />
      </section>
    </div>
  );
}

// ===========================================
// Admin Dashboard Skeleton
// ===========================================

/** Admin dashboard premium loading skeleton */
export function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px]">
      {/* Welcome header skeleton */}
      <div className="rounded-2xl bg-card border border-border p-7 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-64" />
              <SkeletonBlock className="h-4 w-48" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="w-9 h-9 rounded-xl" />
            </div>
            <SkeletonBlock className="h-8 w-28" />
            <SkeletonBlock className="h-4 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-28 rounded-xl" />
        </div>
        <SkeletonBlock className="h-[300px] w-full rounded-2xl" />
      </div>

      {/* Two-column skeleton */}
      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-9 h-9 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 sm:px-6 py-3.5">
                <div className="flex items-center gap-3.5">
                  <SkeletonBlock className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1.5">
                    <SkeletonBlock className="h-3.5 w-32" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-5 w-16 rounded-xl" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-9 h-9 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 sm:px-6 py-4 space-y-2">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="w-9 h-9 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className="h-3.5 w-full" />
                    <SkeletonBlock className="h-1.5 w-full rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <SkeletonBlock className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
