import { readFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_TEAM } from "../src/lib/app-shell-data";
import { getDb } from "../src/lib/db/client";

interface MockData {
  people: Array<{ id: string; name: string; email: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  issues: Array<{
    id: string;
    teamId: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeId?: string;
    labelIds: string[];
    createdAt: string;
  }>;
}

const db = getDb();
const mock: MockData = JSON.parse(
  readFileSync(path.join(process.cwd(), "src/lib/mock/issues.json"), "utf-8"),
);

db.exec(
  "DELETE FROM issue_labels; DELETE FROM issues; DELETE FROM labels; DELETE FROM users; DELETE FROM teams;",
);

db.prepare("INSERT INTO teams (id, name, color, initial) VALUES (?, ?, ?, ?)").run(
  DEFAULT_TEAM.slug,
  DEFAULT_TEAM.name,
  DEFAULT_TEAM.color,
  DEFAULT_TEAM.initial,
);

const insertUser = db.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)");
for (const p of mock.people) insertUser.run(p.id, p.name, p.email);

const insertLabel = db.prepare("INSERT INTO labels (id, name, color) VALUES (?, ?, ?)");
for (const l of mock.labels) insertLabel.run(l.id, l.name, l.color);

const insertIssue = db.prepare(
  "INSERT INTO issues (id, team_id, title, description, status, priority, assignee_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
);
const insertIssueLabel = db.prepare("INSERT INTO issue_labels (issue_id, label_id) VALUES (?, ?)");

for (const issue of mock.issues) {
  insertIssue.run(
    issue.id,
    issue.teamId,
    issue.title,
    issue.description ?? null,
    issue.status,
    issue.priority,
    issue.assigneeId ?? null,
    issue.createdAt,
  );
  for (const labelId of issue.labelIds) insertIssueLabel.run(issue.id, labelId);
}

const count = (table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

console.log("Seed tamamlandi ->", path.join(process.cwd(), "data/self-board.db"));
console.log({
  teams: count("teams"),
  users: count("users"),
  labels: count("labels"),
  issues: count("issues"),
});
