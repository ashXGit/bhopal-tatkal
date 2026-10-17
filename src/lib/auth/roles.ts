// Role-based access rules. Used by middleware (route guard) and server actions / API routes.

export type AppRole = "CITIZEN" | "AUTHORITY" | "ZONE_OFFICER" | "ADMIN";

export const ROUTE_ACCESS: { prefix: string; roles: AppRole[] }[] = [
  { prefix: "/authority", roles: ["AUTHORITY", "ZONE_OFFICER", "ADMIN"] },
  { prefix: "/admin", roles: ["ZONE_OFFICER", "ADMIN"] },
  { prefix: "/api/authority", roles: ["AUTHORITY", "ZONE_OFFICER", "ADMIN"] },
  { prefix: "/api/admin", roles: ["ZONE_OFFICER", "ADMIN"] },
  { prefix: "/my-issues", roles: ["CITIZEN", "AUTHORITY", "ZONE_OFFICER", "ADMIN"] },
  { prefix: "/messages", roles: ["CITIZEN", "AUTHORITY", "ZONE_OFFICER", "ADMIN"] },
];

export function canAccess(pathname: string, role: AppRole | null): boolean {
  const rule = ROUTE_ACCESS.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return true; // public route
  return role != null && rule.roles.includes(role);
}

export const DEMO_USERS: { id: string; role: AppRole; label: string; departmentId?: string }[] = [
  { id: "demo-citizen", role: "CITIZEN", label: "Citizen Demo" },
  { id: "demo-authority-roads", role: "AUTHORITY", label: "Authority Demo (Roads)", departmentId: "roads" },
  { id: "demo-zone-officer", role: "ZONE_OFFICER", label: "Zone Officer Demo" },
  { id: "demo-admin", role: "ADMIN", label: "Admin Demo" },
];
