import { DatabaseSync } from "node:sqlite";
import { ensureSchema, seedIfEmpty } from "@/lib/db/schema";

/**
 * Testler için bellek içi, şeması kurulmuş veritabanı. `seed: false` boş bir
 * şema döner (yine de varsayılan "Core" projesi ve durumları var — bunları
 * migration'lar ekliyor).
 */
export function createTestDb({ seed = true }: { seed?: boolean } = {}): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureSchema(db);
  if (seed) seedIfEmpty(db);
  return db;
}

/** Bir projenin belirli tipteki ilk durumunun id'si. */
export function stateIdOfType(db: DatabaseSync, projectId: string, type: string): string {
  const row = db
    .prepare("SELECT id FROM workflow_states WHERE project_id = ? AND type = ? ORDER BY position LIMIT 1")
    .get(projectId, type) as { id: string } | undefined;
  if (!row) throw new Error(`No ${type} state in ${projectId}`);
  return row.id;
}
