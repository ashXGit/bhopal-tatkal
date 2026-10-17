"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { postJSON } from "@/lib/client";

const CATEGORIES = [
  { id: "roads", icon: "🛣️", label: "Roads" },
  { id: "water", icon: "💧", label: "Water" },
  { id: "sanitation", icon: "🗑️", label: "Garbage" },
  { id: "streetlights", icon: "💡", label: "Street Lights" },
  { id: "drainage", icon: "🚰", label: "Drainage" },
  { id: "electricity", icon: "⚡", label: "Electricity" },
  { id: "parks", icon: "🌳", label: "Parks" },
  { id: "traffic", icon: "🚦", label: "Traffic" },
  { id: "infrastructure", icon: "🏗️", label: "Public Infra" },
  { id: "other", icon: "📋", label: "Other" },
];

type Result = {
  reference: string;
  status: string;
  possibleDuplicate: boolean;
  ai: {
    demo: boolean; language: string; departmentId: string; categoryId: string; confidence: number; keyTerms: string[]; reason: string;
    urgency: { level: string; score: number; reasons: string[] };
    locality: { name: string; ward: number } | null;
  };
};

type SpeechRec = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void };

export function ReportForm() {
  const [category, setCategory] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"TEXT" | "VOICE" | "IMAGE">("TEXT");
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [locationText, setLocationText] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  function speak() {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Rec = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Rec) return setNote("Voice input is not available in this browser. Please type your problem.");
    if (listening) return recRef.current?.stop();
    const rec = new Rec();
    rec.lang = "hi-IN"; // understands Hindi + Hinglish + Indian English
    rec.interimResults = false;
    rec.onresult = (e) => {
      setText((t) => `${t} ${e.results[0][0].transcript}`.trim());
      setMode("VOICE");
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setNote("Could not hear clearly. You can type instead."); };
    recRef.current = rec;
    setListening(true);
    setNote("Listening… bolna shuru karein");
    rec.start();
  }

  function locate() {
    if (!navigator.geolocation) return setNote("Location is not available. Please type your area.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setNote("📍 Location added"); },
      () => setNote("Location permission denied. Please type your area, e.g. 'MP Nagar ke paas'."),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await postJSON<Result>("/api/complaints", {
        text: text || caption,
        inputMode: photo ? "IMAGE" : mode,
        imageUrl: photo ? "/demo/photo-placeholder.svg" : null, // prototype: photo preview only, not uploaded
        imageCaption: caption || null,
        locationText: locationText || null,
        categoryHint: category,
        ...coords,
      });
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result) return <AIResult r={result} />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className="text-lg font-bold">1. What is the problem?</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id === category ? null : c.id)} aria-pressed={category === c.id}
              className={`flex min-h-20 flex-col items-center justify-center rounded-2xl border text-sm font-semibold ${category === c.id ? "border-ink bg-ink text-white" : "border-line bg-surface hover:bg-civic-50"}`}>
              <span className="text-2xl" aria-hidden>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="text" className="text-lg font-bold">2. Describe your problem</label>
        <textarea id="text" value={text} onChange={(e) => setText(e.target.value)} rows={4} required={!caption}
          placeholder="Example: road me bada gadha hai…" className="mt-2 w-full rounded-2xl border border-line bg-surface p-4 text-base" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={speak} className={`rounded-full border px-4 py-2.5 font-semibold ${listening ? "border-red-300 bg-red-50 text-urgency-critical" : "border-line bg-surface"}`}>
            🎙️ {listening ? "Stop" : "Speak your problem"}
          </button>
          <label className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2.5 font-semibold">
            📷 Add Photo
            <input type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
          </label>
        </div>
        {photo && (
          <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Your photo preview" className="max-h-48 rounded-xl" />
            <label htmlFor="caption" className="mt-2 block font-semibold">Photo ke baare mein thoda bataiye</label>
            <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ye road school ke paas toot gaya hai."
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5" />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="loc" className="text-lg font-bold">3. Location / Ward</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input id="loc" value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="e.g. MP Nagar ke paas, DB Mall, board office wali road"
            className="min-h-12 flex-1 rounded-full border border-line bg-surface px-4" />
          <button type="button" onClick={locate} className="rounded-full border border-line bg-surface px-4 font-semibold">📍 Use My Location</button>
        </div>
      </div>

      {note && <p className="text-sm text-muted" role="status">{note}</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-urgency-critical" role="alert">{error}</p>}

      <button disabled={busy} className="w-full rounded-full bg-ink py-4 text-lg font-bold text-white hover:bg-civic-700 disabled:opacity-60">
        {busy ? "AI is checking your complaint…" : "📢 Submit Problem"}
      </button>
    </form>
  );
}

function AIResult({ r }: { r: Result }) {
  const a = r.ai;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-leaf-100 bg-leaf-50 p-5">
        <p className="text-sm font-semibold text-leaf-600">✅ Complaint received · {r.reference}</p>
        <h2 className="mt-1 text-2xl font-extrabold">AI checked your complaint</h2>
        <p className="mt-1 text-muted">Status: <b>Pending Authority Review</b>. It goes live only after an authority approves it.</p>
      </div>

      {r.possibleDuplicate && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">
          ⚠️ This looks similar to an existing issue. An authority will review it before it is published.
        </div>
      )}

      <div className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">What AI understood</h3>
          {a.demo && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Demo AI Processing</span>}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Item k="Department → Category" v={`${a.departmentId} → ${a.categoryId}`} />
          <Item k="AI Confidence" v={`${Math.round(a.confidence * 100)}%`} />
          <Item k="Urgency" v={`${a.urgency.level} · ${a.urgency.score}/100`} />
          <Item k="Location / Ward" v={a.locality ? `${a.locality.name} · Ward ${a.locality.ward}` : "Not found, authority will confirm"} />
          <Item k="Language" v={a.language} />
          <Item k="Key terms" v={a.keyTerms.join(", ") || "—"} />
        </dl>
        <p className="mt-4 text-sm"><b>Why this department?</b> {a.reason}</p>
        {a.urgency.reasons.length > 0 && <p className="mt-1 text-sm"><b>Why this urgency?</b> {a.urgency.reasons.join(" · ")}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/my-issues" className="rounded-full bg-ink px-6 py-3 font-bold text-white">Track My Issue</Link>
        <Link href="/explore" className="rounded-full border border-line bg-surface px-6 py-3 font-semibold">Explore Issues</Link>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-page p-3">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-semibold capitalize">{v}</dd>
    </div>
  );
}
