import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/current-user";
import { getReviewQueue } from "@/lib/services/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewCard } from "./ReviewCard";

export async function ReviewQueue({ duplicatesOnly = false }: { duplicatesOnly?: boolean }) {
  const s = await getSession();
  const dept = s?.role === "AUTHORITY" ? s.departmentId : undefined;
  const [queue, categories] = await Promise.all([
    getReviewQueue(dept),
    prisma.category.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { departmentId: "asc" } }),
  ]);
  const items = duplicatesOnly ? queue.filter((c) => c.duplicates.length) : queue;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{duplicatesOnly ? "Duplicate Queue" : "Pending Review"}</h1>
      <p className="mt-1 text-muted">
        No issue goes public until you approve it.{dept && <> Showing <b>{dept}</b> department.</>}
      </p>
      <div className="mt-6 space-y-4">
        {items.length === 0 ? <EmptyState icon="🎉" title="All caught up! No new issues need review." /> : items.map((c) => <ReviewCard key={c.id} c={c} categories={categories} />)}
      </div>
    </div>
  );
}

