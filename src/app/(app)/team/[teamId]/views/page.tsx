import { notFound } from "next/navigation";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { TeamViewsContent } from "./team-views-content";

export default async function TeamViewsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  return <TeamViewsContent />;
}
