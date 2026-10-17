import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { handle } from "@/lib/api";
import { DEMO_USERS } from "@/lib/auth/roles";
import { SESSION_COOKIE, signSession } from "@/lib/auth/session";

// Demo Mode role switcher. Disabled unless DEMO_MODE=true. No real credentials involved.
export const POST = handle(async (req: Request) => {
  if (!config.demoMode) return NextResponse.json({ error: "Demo mode is disabled." }, { status: 404 });
  const { userId } = (await req.json()) as { userId?: string };
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) return NextResponse.json({ error: "Unknown demo user." }, { status: 400 });
  const { value, maxAge } = await signSession({ userId: user.id, role: user.role, departmentId: user.departmentId });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  return res;
});
