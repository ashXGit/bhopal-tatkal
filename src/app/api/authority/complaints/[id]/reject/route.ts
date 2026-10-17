import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth/current-user";
import { rejectComplaint } from "@/lib/services/review";

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const s = await requireRole("AUTHORITY", "ZONE_OFFICER", "ADMIN");
  await rejectComplaint((await params).id, await req.json(), s.userId);
  return NextResponse.json({ ok: true });
});
