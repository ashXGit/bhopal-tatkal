// Tiny client-side fetch helper: JSON in/out, friendly error messages.
export async function postJSON<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Please log in (Demo Mode → choose a role) to do this.");
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}
