import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden>🧭</p>
      <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-civic-600 px-5 py-3 font-semibold text-white">Go to Home</Link>
    </div>
  );
}
