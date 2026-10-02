import { cache } from "react";
import { getDb } from "@/lib/db/client";
import { getEnabledModuleIdsDb } from "@/lib/db/modules";
import { MODULE_REGISTRY } from "@/lib/modules/registry";

/**
 * Etkin modül id'leri. `cache()`: kök layout tek istekte birden çok kez
 * okuyabilir (`lib/data/preferences.ts`'teki `getPreferences` ile aynı
 * gerekçe).
 *
 * DB'de "etkin" işaretli ama koddan kaldırılmış bir modül id'si varsa (ör.
 * modül deprecate edildi) `MODULE_REGISTRY` ile kesişim onu eler — aksi
 * halde var olmayan bir modül için nav girişi render edilmeye çalışılırdı.
 */
export const getEnabledModuleIds = cache(async function getEnabledModuleIds(): Promise<string[]> {
  const enabledInDb = new Set(getEnabledModuleIdsDb(getDb()));
  return MODULE_REGISTRY.filter((module) => enabledInDb.has(module.id)).map((module) => module.id);
});
