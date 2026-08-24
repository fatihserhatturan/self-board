import { notFound } from "next/navigation";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { TeamIssuesContent } from "./team-issues-content";

export default async function TeamIssuesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  return <TeamIssuesContent />;
}
