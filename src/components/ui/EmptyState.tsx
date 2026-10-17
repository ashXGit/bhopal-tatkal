export function EmptyState({ icon = "🌤️", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <div className="text-4xl" aria-hidden>{icon}</div>
      <p className="mt-2 text-lg font-semibold">{title}</p>
      {hint && <p className="mt-1 text-muted">{hint}</p>}
    </div>
  );
}

/** Placeholder for screens that are planned but not built yet in this scaffold. */
export function ComingNext({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-4 rounded-2xl border border-line bg-white p-5">
        <p className="font-semibold">🚧 Planned for this screen</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          {items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      </div>
    </section>
  );
}
