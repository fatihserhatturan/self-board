import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BadgeProps } from "@/components/ui/badge";
import type { PriorityLevel } from "@/components/ui/priority-icon";
import type { StatusState } from "@/components/ui/status-icon";

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface IssueLabel {
  id: string;
  name: string;
  color: NonNullable<BadgeProps["color"]>;
}

// Board bileşenlerinin doğrudan tükettiği, zaten "join" edilmiş şekil —
// gerçek bir SQL sorgusunun (JOIN'li) döneceği şeklin aynısı.
export interface BoardIssue {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  status: StatusState;
  priority: PriorityLevel;
  assignee?: Person;
  labels: IssueLabel[];
  createdAt: string;
}

interface MockData {
  people: Person[];
  labels: IssueLabel[];
  issues: Array<{
    id: string;
    teamId: string;
    title: string;
    description?: string;
    status: StatusState;
    priority: PriorityLevel;
    assigneeId?: string;
    labelIds: string[];
    createdAt: string;
  }>;
}

let cache: MockData | null = null;

async function readMockData(): Promise<MockData> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "src/lib/mock/issues.json");
  const raw = await readFile(filePath, "utf-8");
  cache = JSON.parse(raw) as MockData;
  return cache;
}

/**
 * Takıma ait (hydrate edilmiş) issue'ları döner. `teamId` verilmezse tüm
 * issue'lar döner. Bugün bir JSON dosyasını okuyup elle join yapıyor; ileride
 * SQLite'a geçince bu fonksiyonun *sadece iç gövdesi* bir `db.prepare(...)
 * .all()` çağrısına dönüşecek — dönüş tipi ve çağıran taraflar değişmeyecek.
 */
export async function getIssues(teamId?: string): Promise<BoardIssue[]> {
  const data = await readMockData();
  const peopleById = new Map(data.people.map((p) => [p.id, p]));
  const labelsById = new Map(data.labels.map((l) => [l.id, l]));

  return data.issues
    .filter((issue) => !teamId || issue.teamId === teamId)
    .map((issue) => ({
      id: issue.id,
      teamId: issue.teamId,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      assignee: issue.assigneeId ? peopleById.get(issue.assigneeId) : undefined,
      labels: issue.labelIds.map((id) => labelsById.get(id)!).filter(Boolean),
      createdAt: issue.createdAt,
    }));
}
