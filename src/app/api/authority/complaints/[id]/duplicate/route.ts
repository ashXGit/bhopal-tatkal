import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth/current-user";
import { markDifferentIssue, markSameIssue } from "@/lib/services/review";

const body = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("SAME_ISSUE"), issueId: z.string() }),
  z.object({ decision: z.literal("DIFFERENT_ISSUE") }),
]);

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireRole("AUTHORITY", "ZONE_OFFICER", "ADMIN");
  const id = (await params).id;
  const input = body.parse(await req.json());
  if (input.decision === "SAME_ISSUE") await markSameIssue(id, input.issueId, s.userId);
  else await markDifferentIssue(id, s.userId);
  return NextResponse.json({ ok: true });
});
