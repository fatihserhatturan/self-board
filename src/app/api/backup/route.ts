import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { restoreFromFile } from "@/lib/db/restore";
import { todayIsoDate } from "@/lib/board/cycle-status";

export const dynamic = "force-dynamic";

const MAX_RESTORE_BYTES = 512 * 1024 * 1024;

function tempPath(): string {
  return path.join(tmpdir(), `self-board-${crypto.randomUUID()}.db`);
}

/**
 * Veritabanı dosyasının tam kopyası — JSON dökümünün aksine görselleri ve proje
 * ikonlarını da içeriyor, doğrudan geri yüklenebiliyor. `VACUUM INTO`, WAL'daki
 * değişiklikler dahil tutarlı bir kopya üretiyor (dosyayı elle kopyalamak
 * yarıda kalmış bir yazmayı yakalayabilirdi).
 */
export async function GET(): Promise<Response> {
  const target = tempPath();
  try {
    getDb().prepare("VACUUM INTO ?").run(target);
    const bytes = readFileSync(target);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="self-board-${todayIsoDate()}.db"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    rmSync(target, { force: true });
  }
}

/**
 * Yedeği geri yükler. Yüklenen dosya önce geçici bir yola yazılıp doğrulanıyor;
 * ancak geçerliyse içeriği açık veritabanına kopyalanıyor (bkz. `restoreFromFile`).
 * Gövde ham dosya: server action'ların 8 MB sınırı yedekler için dar.
 */
export async function POST(request: Request): Promise<Response> {
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0) return Response.json({ error: "empty-file" }, { status: 400 });
  if (body.byteLength > MAX_RESTORE_BYTES) {
    return Response.json({ error: "file-too-large" }, { status: 413 });
  }

  const incoming = tempPath();
  writeFileSync(incoming, body);

  try {
    assertRestorable(incoming);
  } catch {
    rmSync(incoming, { force: true });
    return Response.json({ error: "invalid-backup" }, { status: 400 });
  }

  try {
    restoreFromFile(getDb(), incoming);
  } finally {
    rmSync(incoming, { force: true });
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}

/** Dosya gerçekten bu uygulamanın veritabanı mı ve bozuk değil mi? */
function assertRestorable(filePath: string): void {
  const candidate = new DatabaseSync(filePath, { readOnly: true });
  try {
    const integrity = candidate.prepare("PRAGMA integrity_check").get() as {
      integrity_check: string;
    };
    if (integrity.integrity_check !== "ok") throw new Error("integrity-failed");

    const tables = candidate
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as { name: string }[];
    const names = new Set(tables.map((row) => row.name));
    for (const required of ["users", "projects", "issues"]) {
      if (!names.has(required)) throw new Error("missing-table");
    }
  } finally {
    candidate.close();
  }
}
