import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type Session } from "./session";
import type { AppRole } from "./roles";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Please sign in to continue." : "You do not have access to this.");
  }
}

/** Server-side guard for API routes / server actions (middleware is not the only line of defence). */
export async function requireRole(...roles: AppRole[]): Promise<Session> {
  const s = await getSession();
  if (!s) throw new AuthError(401);
  if (roles.length && !roles.includes(s.role)) throw new AuthError(403);
  return s;
}
