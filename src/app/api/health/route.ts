import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
  }
  const ai = config.aiProvider === "demo" || !config.aiApiKey ? "demo" : config.aiProvider;
  return NextResponse.json(
    { status: database === "ok" ? "ok" : "degraded", database, ai, demoMode: config.demoMode, time: new Date().toISOString() },
    { status: database === "ok" ? 200 : 503 },
  );
}
