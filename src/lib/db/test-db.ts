import { DatabaseSync } from "node:sqlite";
import { Puzzle } from "lucide-react";
import { ensureSchema, seedIfEmpty } from "@/lib/db/schema";
import { MODULE_REGISTRY } from "@/lib/modules/registry";

const FAKE_MODULE_TABLE = "test_module_refs";

/**
 * Ek referansı tutan sahte bir modülü registry'ye geçici olarak ekler: core'un
 * ek korumasını gerçek bir modülden bağımsız test etmek için. `addRef` modülün
 * bir eke referans verdiğini kaydeder.
 */
export function withFakeAttachmentModule<T>(
  dbs: DatabaseSync[],
  run: (addRef: (db: DatabaseSync, attachmentId: string) => void) => T,
): T {
  for (const db of dbs) {
    db.exec(`CREATE TABLE IF NOT EXISTS ${FAKE_MODULE_TABLE} (attachment_id TEXT NOT NULL)`);
  }
  MODULE_REGISTRY.push({
    id: "test-attachments",
    scope: "global",
    icon: Puzzle,
    nameKey: "nav.myIssues",
    descriptionKey: "nav.myIssues",
    nav: { href: "/my-issues", labelKey: "nav.myIssues" },
    tables: [FAKE_MODULE_TABLE],
    attachmentRefsSql: `SELECT attachment_id FROM ${FAKE_MODULE_TABLE}`,
  });
  try {
    return run((db, attachmentId) => {
      db.prepare(`INSERT INTO ${FAKE_MODULE_TABLE} (attachment_id) VALUES (?)`).run(attachmentId);
    });
  } finally {
    MODULE_REGISTRY.pop();
  }
}

/** Test için bir attachment satırı ekler; `createdAt` varsayılan olarak 2 gün önce (prune eşiğinin ötesi). */
export function insertTestAttachment(
  db: DatabaseSync,
  id: string,
  { issueId = null, createdAt = new Date(Date.now() - 2 * 86_400_000).toISOString() }: {
    issueId?: string | null;
    createdAt?: string;
  } = {},
): void {
  db.prepare(
    "INSERT INTO attachments (id, mime_type, data, created_at, issue_id) VALUES (?, 'image/png', x'00', ?, ?)",
  ).run(id, createdAt, issueId);
}

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
