import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { listPublicIssues } from "@/lib/services/issues";

// Public, paginated, anonymised issue list.
export const GET = handle(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return NextResponse.json(await listPublicIssues(params));
});
