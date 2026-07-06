import Navbar from '@/components/Navbar';
import { HomePageSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      <HomePageSkeleton />
    </div>
  );
}
