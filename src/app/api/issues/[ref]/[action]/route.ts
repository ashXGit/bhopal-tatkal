import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getSession, requireRole } from "@/lib/auth/current-user";
import { postMessage, submitExplanation, toggleUpvote, updateStatus } from "@/lib/services/actions";

const STAFF = ["AUTHORITY", "ZONE_OFFICER", "ADMIN"] as const;

// POST /api/issues/:ref/upvote | status | explanation | messages
export const POST = handle(async (req: Request, { params }: { params: Promise<{ ref: string; action: string }> }) => {
  const { ref, action } = await params;
  switch (action) {
    case "upvote": {
      const s = await getSession();
      const userId = s?.userId ?? "demo-citizen";
      return NextResponse.json(await toggleUpvote(ref, userId));
    }
    case "messages": {
      const s = await requireRole();
      return NextResponse.json(await postMessage(ref, await req.json(), s), { status: 201 });
    }
    case "status": {
      const s = await requireRole(...STAFF);
      await updateStatus(ref, await req.json(), s);
      return NextResponse.json({ ok: true });
    }
    case "explanation": {
      const s = await requireRole(...STAFF);
      await submitExplanation(ref, await req.json(), s);
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
});
