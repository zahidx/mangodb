import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Premium Mangoes",
  description: "Browse our complete catalog of farm-fresh, premium mangoes. Find the best Himsagar, Lengra, and organic varieties harvested directly from Rajshahi.",
  openGraph: {
    title: "Shop Premium Mangoes | MangoDB",
    description: "Browse our complete catalog of farm-fresh, premium mangoes. Find the best Himsagar, Lengra, and organic varieties harvested directly from Rajshahi.",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
