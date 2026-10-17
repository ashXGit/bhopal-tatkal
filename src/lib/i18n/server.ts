import "server-only";
import { cookies } from "next/headers";
import { DICTIONARY, LANGS, type Lang } from "./dictionary";

export const LANG_COOKIE = "tatkal_lang";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return (LANGS as readonly string[]).includes(v ?? "") ? (v as Lang) : "hinglish";
}

export async function getDict() {
  const lang = await getLang();
  return { lang, t: DICTIONARY[lang] };
}
