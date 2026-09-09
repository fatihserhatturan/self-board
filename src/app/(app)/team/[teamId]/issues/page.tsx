import { notFound } from "next/navigation";
import { getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { getView } from "@/lib/data/views";
import { DEFAULT_TEAM } from "@/lib/app-shell-data";
import { IssueWorkspace } from "@/components/board/issue-workspace";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function TeamIssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { teamId } = await params;
  const { view: viewId } = await searchParams;
  if (teamId !== DEFAULT_TEAM.slug) notFound();

  const [issues, users, labels, savedView] = await Promise.all([
    getIssues(DEFAULT_TEAM.slug),
    getUsers(),
    getLabels(),
    viewId ? getView(viewId) : Promise.resolve(null),
  ]);

  return (
    <IssueWorkspace
      titleKey="nav.issues"
      breadcrumb={DEFAULT_TEAM.name}
      teamId={DEFAULT_TEAM.slug}
      issues={issues}
      users={users}
      labels={labels}
      initialView={savedView ?? undefined}
    />
  );
}
