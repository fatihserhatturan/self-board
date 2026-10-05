import type { DatabaseSync } from "node:sqlite";
import { releaseIssueAttachments, syncIssueAttachments } from "@/lib/db/attachment-links";
import { MODULE_REGISTRY } from "@/lib/modules/registry";

/**
 * Silme temizliği açıkça, çocuk satırlardan başlayarak yapılıyor. `node:sqlite`
 * foreign key'leri zorluyor ama eski DB'lerde ALTER ile eklenen kolonların
 * `REFERENCES`'ı yok ve bazı ilişkilerde `ON DELETE` tanımlı değil (bkz.
 * README) — cascade'e güvenmek şemanın geçmişine göre farklı sonuç verirdi.
 * Yeni bir tablo bir üst tabloya bağlanırsa temizliği buraya eklemek gerekir.
 */

function inTransaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec("BEGIN");
  try {
    const result = run();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

/** Issue'yu ve ona bağlı etiket, not ve ek satırlarını siler. Issue yoksa `false`. */
export function deleteIssueCascade(db: DatabaseSync, issueId: string): boolean {
  return inTransaction(db, () => {
    db.prepare("DELETE FROM issue_labels WHERE issue_id = ?").run(issueId);
    db.prepare("DELETE FROM issue_notes WHERE issue_id = ?").run(issueId);
    releaseIssueAttachments(db, "?", issueId);
    const result = db.prepare("DELETE FROM issues WHERE id = ?").run(issueId);
    return Number(result.changes) > 0;
  });
}

/**
 * Projeyi ve ona bağlı her şeyi siler. `workflow_states` önceden bu listede
 * yoktu; silinen projelerin durum satırları veritabanında yetim kalıyordu.
 */
export function deleteProjectCascade(db: DatabaseSync, projectId: string): boolean {
  const issuesOfProject = "SELECT id FROM issues WHERE project_id = ?";
  return inTransaction(db, () => {
    db.prepare(`DELETE FROM issue_labels WHERE issue_id IN (${issuesOfProject})`).run(projectId);
    db.prepare(`DELETE FROM issue_notes WHERE issue_id IN (${issuesOfProject})`).run(projectId);
    // Modüllerin de kullandığı ekler silinmez, yalnız issue'dan ayrılır; aşağıdaki
    // modül kancası kendi eşlemesini siler, sahipsiz kalanı prune toplar.
    releaseIssueAttachments(db, issuesOfProject, projectId);
    db.prepare("DELETE FROM issues WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM views WHERE project_id = ?").run(projectId);
    db.prepare(
      "DELETE FROM cycle_snapshots WHERE cycle_id IN (SELECT id FROM cycles WHERE project_id = ?)",
    ).run(projectId);
    db.prepare("DELETE FROM cycles WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM workflow_states WHERE project_id = ?").run(projectId);

    // Proje bazlı modüllerin kendi verisi — registry'den türetilir, yeni bir
    // modül eklendiğinde bu dosyaya elle satır eklemek gerekmez. Döngü
    // değişkeni `module` değil: Next'in lint kuralı o adı (Node'un
    // CommonJS `module` global'iyle karışmasın diye) ayırma/const bağlamında yasaklıyor.
    for (const registeredModule of MODULE_REGISTRY) {
      if (registeredModule.scope === "per-project") {
        registeredModule.onProjectDeleted?.(db, projectId);
      }
    }

    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
    return Number(result.changes) > 0;
  });
}

/**
 * Notu siler ve issue'nun eklerini kalan gövdelerle eşitler. Önceden notta
 * geçen görseller issue bir sonraki kaydedilene kadar veritabanında kalıyordu.
 */
export function deleteNoteCascade(db: DatabaseSync, noteId: string): boolean {
  return inTransaction(db, () => {
    const note = db.prepare("SELECT issue_id FROM issue_notes WHERE id = ?").get(noteId) as
      | { issue_id: string }
      | undefined;
    if (!note) return false;

    db.prepare("DELETE FROM issue_notes WHERE id = ?").run(noteId);
    const issue = db.prepare("SELECT description FROM issues WHERE id = ?").get(note.issue_id) as
      | { description: string | null }
      | undefined;
    if (issue) syncIssueAttachments(db, note.issue_id, issue.description);
    return true;
  });
}
