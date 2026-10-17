import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/current-user";
import { ReviewError } from "@/lib/services/review";

// Wraps route handlers: friendly error messages for users, full details only in server logs.
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: err.issues[0]?.message ?? "Please check the form.", fields: err.flatten().fieldErrors }, { status: 400 });
      }
      if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ReviewError) return NextResponse.json({ error: err.message }, { status: 409 });
      console.error("[api]", err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}
