import { notFound } from "next/navigation";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { getViews } from "@/lib/data/views";
import { TeamViewsContent } from "./team-views-content";

// Diğer route'larda olduğu gibi: canlı SQLite state'i okuyor, build-time
// statik üretim denemesine mahal vermemek için dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function TeamViewsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  const views = await getViews(teamId);

  return <TeamViewsContent teamId={teamId} views={views} />;
}
