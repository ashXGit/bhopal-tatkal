import type { AppRole } from "./roles";

// Minimal signed-cookie session using Web Crypto HMAC-SHA256 (works in Edge middleware and Node).
// The cookie only carries { userId, role, exp }; personal data stays in the DB.

export const SESSION_COOKIE = "tatkal_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export type Session = { userId: string; role: AppRole; departmentId?: string; exp: number };

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not configured");
  return "dev-only-insecure-secret-change-me";
}

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function signSession(s: Omit<Session, "exp">): Promise<{ value: string; maxAge: number }> {
  const payload = b64url(enc.encode(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS })));
  return { value: `${payload}.${await hmac(payload)}`, maxAge: MAX_AGE_SECONDS };
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Session;
    return s.exp > Date.now() / 1000 ? s : null;
  } catch {
    return null;
  }
}
