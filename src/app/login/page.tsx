import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { DemoRoleSwitcher } from "@/components/layout/DemoRoleSwitcher";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // Real authentication (OTP for citizens, SSO for officials) is out of scope for the MVP.
  if (!config.demoMode) notFound();
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">Demo Mode: choose a role</h1>
      <p className="mt-2 text-muted">These are demo accounts with synthetic data. No real credentials are used.</p>
      <div className="mt-6">
        <DemoRoleSwitcher next={safeNext} />
      </div>
    </div>
  );
}
