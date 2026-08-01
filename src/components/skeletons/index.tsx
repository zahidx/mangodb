// ===========================================
// Reusable Skeleton Components
// ===========================================

/** Base shimmer block */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] ${className}`}
    />
  );
}

/** Product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Image placeholder */}
      <SkeletonBlock className="aspect-square w-full rounded-none" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-3 w-full" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonBlock className="h-5 w-20" />
          <SkeletonBlock className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Product grid skeleton (for products page) */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
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
            <SkeletonBlock className="h-10 w-20 rounded-lg" />
            <SkeletonBlock className="h-10 w-20 rounded-lg" />
            <SkeletonBlock className="h-10 w-20 rounded-lg" />
          </div>
          <SkeletonBlock className="h-24 w-full rounded-xl" />
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
          <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
            <SkeletonBlock className="w-20 h-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-1/4" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
            <SkeletonBlock className="w-24 h-10 rounded-lg" />
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-24 w-full rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-10 w-full rounded-lg mt-4" />
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
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="h-8 w-16" />
      <SkeletonBlock className="h-3 w-24" />
    </div>
  );
}

/** Banner / carousel skeleton */
export function BannerSkeleton() {
  return (
    <SkeletonBlock className="w-full h-[200px] sm:h-[300px] lg:h-[400px] rounded-2xl" />
  );
}

// ===========================================
// Premium Homepage Skeletons
// ===========================================

/** Hero banner skeleton — full-width premium shimmer */
export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
      </div>
      {/* Decorative skeleton shapes */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-16 max-w-4xl space-y-4">
        <SkeletonBlock className="h-10 sm:h-14 md:h-16 w-3/4 max-w-xl" />
        <SkeletonBlock className="h-4 sm:h-5 w-1/2 max-w-md" />
        <SkeletonBlock className="h-12 w-32 rounded-lg mt-4" />
      </div>
      {/* Bottom dots skeleton */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="w-2 h-2 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Promo banners skeleton — two cards side by side */
export function PromoBannersSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-white border border-gray-200">
            <SkeletonBlock className="h-44 sm:h-48 w-full rounded-none" />
            <div className="p-4 sm:p-5 space-y-2">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Featured products skeleton — horizontal scrollable row of cards */
export function FeaturedProductsSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-14">
      {/* Section header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
        <SkeletonBlock className="h-4 w-16" />
      </div>
      {/* Scrollable row */}
      <div className="flex gap-4 sm:gap-5 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-white rounded-md border border-gray-200 overflow-hidden"
          >
            <SkeletonBlock className="h-40 sm:h-44 w-full rounded-none" />
            <div className="p-3.5 space-y-2">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-5 w-20" />
              <div className="flex gap-1.5 mt-2.5">
                <SkeletonBlock className="h-9 flex-1 rounded-md" />
                <SkeletonBlock className="h-9 flex-1 rounded-md" />
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
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navbar is rendered by loading.tsx separately */}
      <div className="grow flex flex-col relative z-10 pt-16">
        <HeroBannerSkeleton />
        <PromoBannersSkeleton />
        <FeaturedProductsSkeleton />
        {/* Category tabs skeleton */}
        <section className="max-w-7xl mx-auto px-4 mt-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-10 w-28 rounded-md" />
            ))}
          </div>
        </section>
        {/* Products grid skeleton */}
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 space-y-2">
            <SkeletonBlock className="h-8 w-64 mx-auto" />
            <SkeletonBlock className="h-1 w-16 mx-auto" />
          </div>
          <ProductGridSkeleton count={8} />
        </section>
      </div>
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
      <div className="rounded-lg bg-gradient-to-br from-emerald-50 via-amber-50 to-orange-50 border border-amber-200/40 p-7 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-64" />
              <SkeletonBlock className="h-4 w-48" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-28 rounded-md" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="w-9 h-9 rounded-md" />
            </div>
            <SkeletonBlock className="h-8 w-28" />
            <SkeletonBlock className="h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-lg border border-slate-200/80 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-md" />
            <div className="space-y-1.5">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-28 rounded-md" />
        </div>
        <SkeletonBlock className="h-[300px] w-full rounded-md" />
      </div>

      {/* Two-column skeleton */}
      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-9 h-9 rounded-md" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 sm:px-6 py-3.5">
                <div className="flex items-center gap-3.5">
                  <SkeletonBlock className="w-9 h-9 rounded-md" />
                  <div className="space-y-1.5">
                    <SkeletonBlock className="h-3.5 w-32" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-5 w-16 rounded-md" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-9 h-9 rounded-md" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 sm:px-6 py-4 space-y-2">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="w-9 h-9 rounded-md" />
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
      <div className="bg-white rounded-lg border border-slate-200/80 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <SkeletonBlock className="w-9 h-9 rounded-md" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-16 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
