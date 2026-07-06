// ===========================================
// Infinite Scroll Hook for Products
// ===========================================
// Fetches products in pages via getProducts() with IntersectionObserver.
// Resets automatically when filter/sort options change.

import { getProducts } from "@/lib/supabase/queries";
import type { Product } from "@/types/database";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteProductsOptions {
  categorySlug?: string;
  search?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name";
  pageSize?: number;
  /** When this value changes, the product list resets */
  resetKey: string;
}

interface UseInfiniteProductsResult {
  products: Product[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  /** Call this as the ref of a sentinel element at the bottom of the grid */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Manually load the next page */
  loadMore: () => void;
  /** Manually reset and reload from scratch */
  reset: () => void;
}

export function useInfiniteProducts(
  options: UseInfiniteProductsOptions
): UseInfiniteProductsResult {
  const { categorySlug, search, sortBy = "newest", pageSize = 12, resetKey } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const totalCountRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);

  // Reset everything when filters change
  useEffect(() => {
    offsetRef.current = 0;
    totalCountRef.current = 0;
    setProducts([]);
    setHasMore(true);
    setError(null);
    setLoading(true);
    isFetchingRef.current = false;

    // Nuclear safety timeout: guarantee loading clears after 8s
    const safetyTimer = setTimeout(() => {
      if (isFetchingRef.current) {
        isFetchingRef.current = false;
      }
      setLoading(false);
      setLoadingMore(false);
      setError("Could not load products. Database may be unavailable.");
    }, 8000);

    loadPage(0, true);

    return () => {
      clearTimeout(safetyTimer);
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const loadPage = useCallback(
    async (offset: number, isInitial: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const res = await getProducts({
          categorySlug,
          search,
          sortBy,
          limit: pageSize,
          offset,
        });

        if (res.error) {
          setError(res.error.message || "Failed to load products");
          setLoading(false);
          setLoadingMore(false);
          isFetchingRef.current = false;
          return;
        }

        const fetched = res.data || [];
        const count = res.count ?? 0;
        totalCountRef.current = count;

        if (isInitial) {
          setProducts(fetched);
        } else {
          setProducts((prev) => [...prev, ...fetched]);
        }

        // Determine if there are more results
        const newOffset = offset + pageSize;
        offsetRef.current = newOffset;
        setHasMore(count > newOffset || fetched.length === pageSize);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categorySlug, search, sortBy, pageSize]
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || isFetchingRef.current) return;
    setLoadingMore(true);
    loadPage(offsetRef.current, false);
  }, [loadingMore, hasMore, loadPage]);

  const reset = useCallback(() => {
    offsetRef.current = 0;
    totalCountRef.current = 0;
    setProducts([]);
    setHasMore(true);
    setError(null);
    setLoading(true);
    setLoadingMore(false);
    isFetchingRef.current = false;
    loadPage(0, true);
  }, [loadPage]);

  // Set up IntersectionObserver on the sentinel
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadMore]);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    sentinelRef,
    loadMore,
    reset,
  };
}
