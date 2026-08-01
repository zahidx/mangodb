import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProductGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full grow">
        <div className="space-y-6 mb-8">
          <div className="h-8 w-48 bg-muted-bg rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-muted-bg rounded-lg animate-pulse" />
        </div>
        <ProductGridSkeleton count={10} />
      </main>
      <Footer />
    </div>
  );
}
