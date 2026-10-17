"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden>⚠️</p>
      <h1 className="mt-3 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. Your data is safe.</p>
      <button onClick={reset} className="mt-6 rounded-xl bg-civic-600 px-5 py-3 font-semibold text-white">Try again</button>
    </div>
  );
}
