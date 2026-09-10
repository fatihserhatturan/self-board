import { redirect } from "next/navigation";
import { getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { getView } from "@/lib/data/views";
import { getProjects, resolveActiveProject } from "@/lib/data/projects";
import { getCycles, getCycleSnapshots } from "@/lib/data/cycles";
import { cycleLabel } from "@/lib/board/cycle-label";
import { IssueWorkspace } from "@/components/board/issue-workspace";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; view?: string; cycle?: string }>;
}) {
  const { project: projectParam, view: viewId, cycle: cycleId } = await searchParams;

  const projects = await getProjects();
  const project = resolveActiveProject(projects, projectParam);
  if (project.id !== projectParam) {
    redirect(`/issues?project=${project.id}`);
  }

  const [issues, users, labels, savedView, cycles] = await Promise.all([
    getIssues(project.id, cycleId),
    getUsers(),
    getLabels(),
    viewId ? getView(viewId) : Promise.resolve(null),
    getCycles(project.id),
  ]);

  const activeCycle = cycleId ? cycles.find((cycle) => cycle.id === cycleId) : undefined;
  const breadcrumb = activeCycle ? `${project.name} / ${cycleLabel(activeCycle)}` : project.name;
  const cycleSnapshots = activeCycle
    ? ((await getCycleSnapshots(project.id))[activeCycle.id] ?? [])
    : [];

  return (
    <IssueWorkspace
      key={`${project.id}:${cycleId ?? ""}`}
      titleKey="nav.issues"
      breadcrumb={breadcrumb}
      projectId={project.id}
      cycleId={cycleId ?? null}
      issues={issues}
      users={users}
      labels={labels}
      cycles={cycles}
      cycleSnapshots={cycleSnapshots}
      initialView={savedView ?? undefined}
    />
  );
}
