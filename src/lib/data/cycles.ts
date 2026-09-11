import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/client";
import { asString } from "@/lib/db/row-values";
import { isoDateFromDate, todayIsoDate } from "@/lib/board/cycle-status";

/** Sayımlar kullanıcı durumlarına değil beş sabit sistem tipine göre — kullanıcı istediği kadar durum tanımlasa da bu şekil sabit kalıyor. */
export interface CycleStatusCounts {
  backlog: number;
  unstarted: number;
  started: number;
  completed: number;
  canceled: number;
}

export interface Cycle {
  id: string;
  projectId: string;
  number: number;
  name: string | null;
  startsAt: string;
  endsAt: string;
  totalIssues: number;
  completedIssues: number;
  counts: CycleStatusCounts;
  createdAt: string;
}

/** Bir cycle'ın belirli bir gündeki durumu — burndown grafiğinin ham verisi. */
export interface CycleSnapshot {
  cycleId: string;
  date: string;
  scope: number;
  started: number;
  completed: number;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return isoDateFromDate(date);
}

interface CycleRow {
  id: string;
  number: number;
  starts_at: string;
  ends_at: string;
}

/**
 * Bir cycle'ın o günkü scope/started/completed sayımını yazar (aynı gün için
 * tekrar çağrılırsa günceller). Arka planda çalışan bir cron olmadığı için
 * snapshot'lar `getCycles()` üzerinden, yani sayfa her açıldığında birikir.
 */
function recordCycleSnapshot(db: DatabaseSync, cycleId: string, date: string): void {
  const counts = db
    .prepare(
      `SELECT
         COUNT(*) AS scope,
         SUM(CASE WHEN s.type = 'started' THEN 1 ELSE 0 END) AS started,
         SUM(CASE WHEN s.type IN ('completed','canceled') THEN 1 ELSE 0 END) AS completed
       FROM issues i
       JOIN workflow_states s ON s.id = i.state_id
       WHERE i.cycle_id = ?`,
    )
    .get(cycleId) as { scope: number; started: number | null; completed: number | null };

  db.prepare(
    `INSERT INTO cycle_snapshots (cycle_id, date, scope, started, completed)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(cycle_id, date) DO UPDATE SET
       scope = excluded.scope, started = excluded.started, completed = excluded.completed`,
  ).run(cycleId, date, counts.scope, counts.started ?? 0, counts.completed ?? 0);
}

/**
 * Cycle'lar arka planda çalışan bir cron olmadan, istek anında "yakala"
 * mantığıyla otomatik üretiliyor. Her `getCycles()` çağrısında:
 * 1. Hiç cycle yoksa Cycle #1 bugünden başlatılır.
 * 2. Bitmiş (`ends_at < today`) HER cycle için — sadece en son/en yüksek
 *    numaralı olan değil — üzerindeki tamamlanmamış issue'lar bir sonraki
 *    cycle'a taşınır (yoksa önce oluşturulur). Bu önemli: her zaman bir
 *    "upcoming" cycle önceden oluşturulduğu için, gerçek aktif cycle bitince
 *    zaten var olan bu upcoming cycle otomatik olarak "aktif" hale gelir —
 *    yeni bir cycle YARATILMAZ. Rollover'ı sadece cycle-oluşturma anına
 *    bağlarsak bu geçiş hiç yakalanmaz. `cycles` dizisi döngü sırasında
 *    büyüyebildiği için (aynı referansa push ediliyor), uygulama uzun süre
 *    açılmadıysa birden fazla cycle zincirleme "yakalanır". Bir cycle'ın
 *    issue'ları taşındıktan sonra üzerinde tamamlanmamış issue kalmayacağı
 *    için bu adım doğal olarak idempotent.
 * 3. Son olarak, bugünden sonra başlayan bir cycle yoksa ileriye dönük
 *    planlama için tam olarak bir "upcoming" cycle daha oluşturulur.
 *
 * Rollover issue'ları cycle'dan ÇIKARDIĞI için, taşımadan hemen önce biten
 * cycle'ın kapanış snapshot'ı alınır — aksi halde o cycle'ın gerçek scope'u
 * ve kaç issue devrettiği kalıcı olarak kaybolurdu.
 */
function ensureCyclesReady(db: DatabaseSync, projectId: string, durationDays: number): void {
  const today = todayIsoDate();

  const cycles = db
    .prepare(
      "SELECT id, number, starts_at, ends_at FROM cycles WHERE project_id = ? ORDER BY number ASC",
    )
    .all(projectId) as unknown as CycleRow[];

  if (cycles.length === 0) {
    cycles.push(insertCycle(db, projectId, 1, today, addDays(today, durationDays - 1)));
  }

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];
    if (cycle.ends_at >= today) continue;

    let next = cycles[i + 1];
    if (!next) {
      const nextStart = addDays(cycle.ends_at, 1);
      next = insertCycle(db, projectId, cycle.number + 1, nextStart, addDays(nextStart, durationDays - 1));
      cycles.push(next);
    }

    recordCycleSnapshot(db, cycle.id, cycle.ends_at);

    db.prepare(
      `UPDATE issues SET cycle_id = ? WHERE cycle_id = ? AND state_id IN (
         SELECT id FROM workflow_states WHERE type NOT IN ('completed','canceled')
       )`,
    ).run(next.id, cycle.id);
  }

  const latest = cycles[cycles.length - 1];
  if (!cycles.some((c) => c.starts_at > today)) {
    const nextStart = addDays(latest.ends_at, 1);
    insertCycle(db, projectId, latest.number + 1, nextStart, addDays(nextStart, durationDays - 1));
  }
}

function insertCycle(
  db: DatabaseSync,
  projectId: string,
  number: number,
  startsAt: string,
  endsAt: string,
): CycleRow {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    "INSERT INTO cycles (id, project_id, number, name, starts_at, ends_at, created_at) VALUES (?, ?, ?, NULL, ?, ?, ?)",
  ).run(id, projectId, number, startsAt, endsAt, createdAt);
  return { id, number, starts_at: startsAt, ends_at: endsAt };
}


export async function getCycles(projectId: string): Promise<Cycle[]> {
  const db = getDb();
  const project = db.prepare("SELECT cycle_duration_days FROM projects WHERE id = ?").get(projectId) as
    | { cycle_duration_days: number }
    | undefined;
  if (!project) return [];

  ensureCyclesReady(db, projectId, project.cycle_duration_days);

  const rows = db
    .prepare(
      `SELECT
         c.id, c.project_id, c.number, c.name, c.starts_at, c.ends_at, c.created_at,
         COUNT(i.id) AS total_issues,
         SUM(CASE WHEN s.type IN ('completed','canceled') THEN 1 ELSE 0 END) AS completed_issues,
         SUM(CASE WHEN s.type = 'backlog' THEN 1 ELSE 0 END) AS backlog,
         SUM(CASE WHEN s.type = 'unstarted' THEN 1 ELSE 0 END) AS unstarted,
         SUM(CASE WHEN s.type = 'started' THEN 1 ELSE 0 END) AS started,
         SUM(CASE WHEN s.type = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN s.type = 'canceled' THEN 1 ELSE 0 END) AS canceled
       FROM cycles c
       LEFT JOIN issues i ON i.cycle_id = c.id
       LEFT JOIN workflow_states s ON s.id = i.state_id
       WHERE c.project_id = ?
       GROUP BY c.id
       ORDER BY c.number DESC`,
    )
    .all(projectId);

  const cycles = rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: asString(r.id),
      projectId: asString(r.project_id),
      number: Number(r.number),
      name: r.name === null ? null : asString(r.name),
      startsAt: asString(r.starts_at),
      endsAt: asString(r.ends_at),
      totalIssues: Number(r.total_issues),
      completedIssues: Number(r.completed_issues ?? 0),
      counts: {
        backlog: Number(r.backlog ?? 0),
        unstarted: Number(r.unstarted ?? 0),
        started: Number(r.started ?? 0),
        completed: Number(r.completed ?? 0),
        canceled: Number(r.canceled ?? 0),
      },
      createdAt: asString(r.created_at),
    };
  });

  // Bugünün snapshot'ı: henüz bitmemiş cycle'lar için (aktif + yaklaşan).
  // Tamamlanmış cycle'ların kapanış snapshot'ı zaten rollover sırasında alındı.
  const today = todayIsoDate();
  for (const cycle of cycles) {
    if (cycle.endsAt >= today) recordCycleSnapshot(db, cycle.id, today);
  }

  return cycles;
}

/** Bir projenin tüm cycle snapshot'ları, cycle id'sine göre gruplanmış. */
export async function getCycleSnapshots(
  projectId: string,
): Promise<Record<string, CycleSnapshot[]>> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.cycle_id, s.date, s.scope, s.started, s.completed
       FROM cycle_snapshots s
       JOIN cycles c ON c.id = s.cycle_id
       WHERE c.project_id = ?
       ORDER BY s.date ASC`,
    )
    .all(projectId);

  const byCycle: Record<string, CycleSnapshot[]> = {};
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const snapshot: CycleSnapshot = {
      cycleId: asString(r.cycle_id),
      date: asString(r.date),
      scope: Number(r.scope),
      started: Number(r.started),
      completed: Number(r.completed),
    };
    (byCycle[snapshot.cycleId] ??= []).push(snapshot);
  }
  return byCycle;
}
