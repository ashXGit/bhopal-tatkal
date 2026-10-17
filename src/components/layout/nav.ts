import type { AppRole } from "@/lib/auth/roles";

// Navigation per role (spec §48). Each entry is ≤ 1 tap from any screen.
export type NavItem = { href: string; label: string; icon: string };

export const CITIZEN_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/explore", label: "Explore", icon: "🗺️" },
  { href: "/report", label: "Report", icon: "📢" },
  { href: "/my-issues", label: "My Issues", icon: "🔎" },
  { href: "/messages", label: "Messages", icon: "💬" },
];

export const AUTHORITY_NAV: NavItem[] = [
  { href: "/authority", label: "Dashboard", icon: "📊" },
  { href: "/authority/review", label: "Pending Review", icon: "⏳" },
  { href: "/authority/duplicates", label: "Duplicate Queue", icon: "⚠️" },
  { href: "/authority/issues", label: "All Issues", icon: "📋" },
  { href: "/authority/tickets", label: "Tickets", icon: "🎫" },
  { href: "/authority/digest", label: "Weekly Digest", icon: "🗓️" },
  { href: "/authority/analytics", label: "Analytics", icon: "📈" },
  { href: "/messages", label: "Messages", icon: "💬" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "🏛️" },
  { href: "/admin/issues", label: "Issues", icon: "📋" },
  { href: "/admin/authorities", label: "Authorities", icon: "🏆" },
  { href: "/admin/departments", label: "Departments", icon: "🏢" },
  { href: "/admin/gazetteer", label: "Wards & Gazetteer", icon: "📍" },
  { href: "/admin/datasets", label: "Datasets", icon: "📥" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export function navFor(role: AppRole | null): NavItem[] {
  if (role === "ADMIN" || role === "ZONE_OFFICER") return ADMIN_NAV;
  if (role === "AUTHORITY") return AUTHORITY_NAV;
  return CITIZEN_NAV;
}
