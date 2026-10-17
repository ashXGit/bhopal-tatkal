"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_USERS } from "@/lib/auth/roles";

const HOME: Record<string, string> = { CITIZEN: "/", AUTHORITY: "/authority", ZONE_OFFICER: "/admin", ADMIN: "/admin" };

export function DemoRoleSwitcher({ next }: { next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(userId: string, role: string) {
    setBusy(userId);
    setError(null);
    const res = await fetch("/api/auth/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId }) });
    setBusy(null);
    if (!res.ok) return setError("Could not switch role. Please try again.");
    router.push(next ?? HOME[role]);
    router.refresh();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DEMO_USERS.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => signIn(u.id, u.role)}
          disabled={busy !== null}
          className="min-h-14 rounded-xl border border-line bg-white px-4 text-left font-semibold hover:border-civic-600 hover:bg-civic-50 disabled:opacity-60"
        >
          {busy === u.id ? "Signing in…" : u.label}
        </button>
      ))}
      {error && <p role="alert" className="text-urgency-critical sm:col-span-2">{error}</p>}
    </div>
  );
}
