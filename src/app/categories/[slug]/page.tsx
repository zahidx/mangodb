"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import QuickViewModal from "@/components/QuickViewModal";
import { ProductGridSkeleton } from "@/components/skeletons";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { useWishlist } from "@/hooks/useWishlist";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/types/database";
import { Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient() as any;
  const { addToCart } = useCart();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const { wishlist, isInWishlist, toggleWishlist } = useWishlist();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    async function load() {
      // Fetch category
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();
      setCategory(cat);

      // Fetch products in this category
      const { data: prods } = await supabase
        .from("products")
        .select("*, category:categories(name, slug)")
        .eq("category_id", cat?.id)
        .order("created_at", { ascending: false });
      setProducts(prods || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="grow max-w-7xl mx-auto px-4 py-8">
          <ProductGridSkeleton count={8} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="grow flex items-center justify-center flex-col gap-4 px-4">
          <span className="text-6xl">🥭</span>
          <h2 className="font-serif-heading text-2xl font-bold text-gray-900">Category Not Found</h2>
          <Link href="/products" className="text-emerald-600 hover:underline text-sm font-semibold">
            Browse All Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero / Banner */}
      <section className="relative w-full h-[220px] sm:h-[300px] overflow-hidden">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-3">
              <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: "Shop Mangoes", href: "/products" },
                { label: category.name },
              ]} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-emerald-100/80 text-sm mt-2 max-w-xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="grow max-w-7xl mx-auto px-4 py-10">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No products found in this category.</p>
            <Link
              href="/products"
              className="inline-block mt-4 text-emerald-600 hover:underline text-sm font-semibold"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Showing {products.length} product{products.length !== 1 ? "s" : ""} in{" "}
              <strong className="text-gray-900">{category.name}</strong>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product: any) => {
                const salePrice = product.sale_price || product.price;
                const originalPrice = product.price;
                const isOnSale = !!product.sale_price;
                const discount = isOnSale
                  ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image */}
                    <Link
                      href={`/products/${product.slug}`}
                      className="relative aspect-square overflow-hidden bg-gray-50"
                    >
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          🥭
                        </div>
                      )}
                      {isOnSale && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{discount}%
                        </span>
                      )}
                      {/* Wishlist button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product.id);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            wishlist.includes(product.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    </Link>

                    {/* Info */}
                    <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      {product.category && (
                        <Link
                          href={`/categories/${product.category.slug}`}
                          className="text-[10px] font-semibold text-emerald-600 hover:underline"
                        >
                          {product.category.name}
                        </Link>
                      )}
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        {product.short_description || ""}
                      </p>

                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            ৳{salePrice?.toLocaleString()}
                          </span>
                          {isOnSale && (
                            <span className="text-[10px] text-gray-400 line-through ml-1">
                              ৳{originalPrice?.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            addToCart(
                              {
                                ...product,
                                sale_price: salePrice,
                              },
                              1,
                              "10kg"
                            );
                            toast.success(`${product.name} added to cart`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Footer />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}
    </div>
  );
}
