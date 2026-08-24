import { notFound } from "next/navigation";
import { getIssues } from "@/lib/data/issues";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { TeamIssuesContent } from "./team-issues-content";

export default async function TeamIssuesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  const issues = await getIssues(DEFAULT_TEAM.slug);

  return <TeamIssuesContent issues={issues} />;
}
