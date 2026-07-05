// ===========================================
// Reusable Skeleton Components
// ===========================================

/** Base shimmer block */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg ${className}`}
    />
  );
}

/** Product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
          <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-24 w-full rounded-lg" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-full" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
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
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
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
