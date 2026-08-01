import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navbar />
      <main className="pt-28 pb-20 grow">
        <CartSkeleton />
      </main>
      <Footer />
    </div>
  );
}
