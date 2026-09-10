import { redirect } from "next/navigation";
import { getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { getView } from "@/lib/data/views";
import { getProjects, resolveActiveProject } from "@/lib/data/projects";
import { IssueWorkspace } from "@/components/board/issue-workspace";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; view?: string }>;
}) {
  const { project: projectParam, view: viewId } = await searchParams;

  const projects = await getProjects();
  const project = resolveActiveProject(projects, projectParam);
  if (project.id !== projectParam) {
    redirect(`/issues?project=${project.id}`);
  }

  const [issues, users, labels, savedView] = await Promise.all([
    getIssues(project.id),
    getUsers(),
    getLabels(),
    viewId ? getView(viewId) : Promise.resolve(null),
  ]);

  return (
    <IssueWorkspace
      key={project.id}
      titleKey="nav.issues"
      breadcrumb={project.name}
      projectId={project.id}
      issues={issues}
      users={users}
      labels={labels}
      initialView={savedView ?? undefined}
    />
  );
}
