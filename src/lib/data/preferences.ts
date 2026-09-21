import { cache } from "react";
import { getDb } from "@/lib/db/client";
import { asString } from "@/lib/db/row-values";
import {
  DATE_FORMATS,
  DEFAULT_PREFERENCES,
  HOME_VIEWS,
  STATUS_TYPES,
  readEnum,
  type Preferences,
} from "@/lib/preferences-config";

/**
 * Tercihler. `cache()` ile sarılı: kök layout ve sayfalar aynı istekte bunu
 * birden çok kez okuyor. Doğrulama (`readEnum`) yazma yoluyla paylaşılıyor —
 * bkz. `lib/preferences-config.ts`.
 */
export const getPreferences = cache(async function getPreferences(): Promise<Preferences> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM app_settings").all();

  const stored = new Map<string, string>();
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    stored.set(asString(r.key), asString(r.value));
  }

  return {
    homeView: readEnum(stored.get("homeView"), HOME_VIEWS, DEFAULT_PREFERENCES.homeView),
    defaultIssueStateType: readEnum(
      stored.get("defaultIssueStateType"),
      STATUS_TYPES,
      DEFAULT_PREFERENCES.defaultIssueStateType,
    ),
    defaultIssuePriority: readEnum(
      stored.get("defaultIssuePriority"),
      ["no-priority", "urgent", "high", "medium", "low"],
      DEFAULT_PREFERENCES.defaultIssuePriority,
    ),
    autoAssignToMe: stored.get("autoAssignToMe") === "true",
    dateFormat: readEnum(stored.get("dateFormat"), DATE_FORMATS, DEFAULT_PREFERENCES.dateFormat),
  };
});
