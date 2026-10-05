import { cache } from "react";
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/client";
import { getEnabledModuleIdsDb } from "@/lib/db/modules";
import type { ModuleSearchEntry } from "@/lib/modules/registry";
import { listWikiSearchEntriesDb } from "@/lib/modules/wiki/db";
import { WIKI_MODULE_ID } from "@/lib/modules/wiki/schema";

/**
 * Modüllerin sunucu tarafı — yalnız sunucuda import edilir (registry'nin
 * aksine client bundle'ına girmiyor, `@/lib/db/*` kullanabiliyor).
 *
 * Komut paletinde aranabilir içerik üreten modüller. Yeni bir modül arama
 * desteği eklerken yalnız bu eşlemeye bir satır ekliyor; layout, provider ve
 * palet modül adını bilmiyor.
 */
const SEARCH_SOURCES: Record<string, (db: DatabaseSync) => ModuleSearchEntry[]> = {
  [WIKI_MODULE_ID]: listWikiSearchEntriesDb,
};

/** Açık modüllerin aranabilir kayıtları. Kapalı modülün içeriği palette görünmüyor. */
export const getModuleSearchEntries = cache(async function getModuleSearchEntries(): Promise<
  ModuleSearchEntry[]
> {
  const db = getDb();
  return getEnabledModuleIdsDb(db).flatMap((moduleId) => SEARCH_SOURCES[moduleId]?.(db) ?? []);
});
