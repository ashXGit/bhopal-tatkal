import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth/current-user";
import { approveComplaint } from "@/lib/services/review";

// Approve, or "Correct & Approve" (body may override department / category / urgency / ward).
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireRole("AUTHORITY", "ZONE_OFFICER", "ADMIN");
  const { issue, ticket } = await approveComplaint((await params).id, await req.json(), s.userId);
  return NextResponse.json({ issue: issue.reference, ticket: ticket.reference });
});
