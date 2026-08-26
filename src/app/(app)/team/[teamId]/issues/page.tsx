import { notFound } from "next/navigation";
import { getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { TeamIssuesContent } from "./team-issues-content";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function TeamIssuesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  const [issues, users, labels] = await Promise.all([
    getIssues(DEFAULT_TEAM.slug),
    getUsers(),
    getLabels(),
  ]);

  return <TeamIssuesContent issues={issues} users={users} labels={labels} />;
}
