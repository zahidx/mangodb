// ===========================================
// Category Landing Page — Dynamic metadata
// ===========================================
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

function getApiClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any;
}

export async function generateStaticParams() {
  const supabase = getApiClient();
  const { data: categories } = await supabase.from("categories").select("slug");
  if (!categories) return [];
  return categories.map((cat: { slug: string }) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getApiClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return { title: "Category Not Found | MangoDB" };
  }

  const title = `${category.name} — Premium Mangoes | MangoDB`;
  const description = category.description || `Browse our selection of premium ${category.name} mangoes. Handpicked and delivered fresh from Rajshahi.`;
  const image = category.image_url || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=1200&h=630&fit=crop&q=80";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: category.name }],
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
