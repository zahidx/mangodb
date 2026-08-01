import { Metadata } from "next";
import { getProductBySlug } from "@/lib/supabase/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: product } = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | MangoBite",
      description: "This premium mango variety could not be found.",
    };
  }

  const title = `${product.name} | MangoBite Premium Harvest`;
  const description = product.description || `Buy farm-fresh ${product.name} online, delivered directly from Rajshahi to your doorstep.`;
  const image = product.images?.[0] || "https://images.unsplash.com/photo-1553279768-865429fa0078?w=1200&h=630&fit=crop&q=80";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${product.name} - MangoBite`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
