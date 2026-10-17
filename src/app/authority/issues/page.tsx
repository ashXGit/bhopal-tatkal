import { ComingNext } from "@/components/ui/EmptyState";

export default function Page() {
  return <ComingNext title="All Issues" items={["Department issues with status updates: Assigned → In Progress → Resolved (note + date required)", "⚠️ Explanation Required for issues unresolved > 30 days"]} />;
}
