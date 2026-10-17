import { ComingNext } from "@/components/ui/EmptyState";

export default function Page() {
  return <ComingNext title="Import Dataset" items={["Upload CSV / JSON (complaint_id, complaint_text, department, category, ward, reported_date, resolved_date, status…)", "Validation report: total / invalid / missing fields / imported", "Imported rows feed median resolution time (HistoricalRecord)"]} />;
}
