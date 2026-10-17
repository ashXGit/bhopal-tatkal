"use client";

import { useRouter } from "next/navigation";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n/dictionary";

export function LanguageToggle({ current }: { current: Lang }) {
  const router = useRouter();
  const choose = (l: Lang) => {
    document.cookie = `tatkal_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div role="group" aria-label="Language" className="flex overflow-hidden rounded-full border border-line bg-white text-sm">
      {(["hi", "hinglish", "en"] as const).filter((l) => LANGS.includes(l)).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={current === l}
          className={`min-h-9 px-3 ${current === l ? "bg-civic-600 font-semibold text-white" : "text-muted hover:bg-civic-50"}`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
