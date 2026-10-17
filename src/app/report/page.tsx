import { ReportForm } from "./ReportForm";

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Report a Problem</h1>
      <p className="mt-1 text-muted">Hindi, Hinglish ya English: jaise chahein waise likhein ya bolein.</p>
      <div className="mt-6"><ReportForm /></div>
    </div>
  );
}
