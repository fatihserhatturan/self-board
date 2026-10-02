"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { setModuleEnabledDb } from "@/lib/db/modules";
import { MODULE_REGISTRY } from "@/lib/modules/registry";
import type { ActionResult } from "@/lib/actions/issues";

/** Modül girişi hem uygulama kenar çubuğunda hem Ayarlar'da görünüyor; ikisi de yenilenmeli. */
function revalidateModuleViews(): void {
  revalidatePath("/", "layout");
  revalidatePath("/settings", "layout");
}

export async function setModuleEnabled(
  id: string,
  enabled: boolean,
): Promise<ActionResult<{ id: string; enabled: boolean }>> {
  if (!MODULE_REGISTRY.some((module) => module.id === id)) {
    return { ok: false, error: "unknown-module" };
  }

  setModuleEnabledDb(getDb(), id, enabled);
  revalidateModuleViews();
  return { ok: true, data: { id, enabled } };
}
