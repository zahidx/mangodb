import { AdminDashboardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-6 sm:p-8">
      <AdminDashboardSkeleton />
    </div>
  );
}
