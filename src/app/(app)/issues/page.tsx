import { redirect } from "next/navigation";
import { getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { getView } from "@/lib/data/views";
import { getProjects, resolveActiveProject } from "@/lib/data/projects";
import { getCycles, getCycleSnapshots } from "@/lib/data/cycles";
import { getWorkflowStates } from "@/lib/data/workflow-states";
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

  // Önce cycle'lar: `getCycles` bitmiş cycle'ların issue'larını devrediyor.
  // `Promise.all` içinde `getIssues` senkron olarak önce çalışıp devir öncesi
  // atamaları okuyordu — devir günü sayfa eski cycle'ı gösteriyordu.
  const cycles = await getCycles(project.id);
  const [issues, users, labels, savedView, states] = await Promise.all([
    getIssues(project.id, cycleId),
    getUsers(),
    getLabels(),
    viewId ? getView(viewId) : Promise.resolve(null),
    getWorkflowStates(project.id),
  ]);

  const activeCycle = cycleId ? cycles.find((cycle) => cycle.id === cycleId) : undefined;
  const breadcrumb = activeCycle ? `${project.name} / ${cycleLabel(activeCycle)}` : project.name;
  const cycleSnapshots = activeCycle
    ? ((await getCycleSnapshots(project.id))[activeCycle.id] ?? [])
    : [];

  return (
    <IssueWorkspace
      // `viewId` de anahtarda: iki kaydedilmiş görünüm arasında gezinirken
      // (ör. geri/ileri) bileşen yeniden kurulmazsa eski filtreler kalıyordu.
      key={`${project.id}:${cycleId ?? ""}:${viewId ?? ""}`}
      titleKey="nav.issues"
      breadcrumb={breadcrumb}
      projectId={project.id}
      cycleId={cycleId ?? null}
      issues={issues}
      users={users}
      labels={labels}
      cycles={cycles}
      cycleSnapshots={cycleSnapshots}
      states={states}
      initialView={savedView ?? undefined}
    />
  );
}
