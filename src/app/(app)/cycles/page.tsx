import { redirect } from "next/navigation";
import { getCycles, getCycleSnapshots } from "@/lib/data/cycles";
import { getProjects, resolveActiveProject } from "@/lib/data/projects";
import { CyclesContent } from "@/app/(app)/cycles/cycles-content";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function CyclesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;

  const projects = await getProjects();
  const project = resolveActiveProject(projects, projectParam);
  if (project.id !== projectParam) {
    redirect(`/cycles?project=${project.id}`);
  }

  // Sıra önemli: `getCycles` bugünün snapshot'ını yazıyor, snapshot'lar
  // ondan sonra okunmalı ki grafik bugünü de içersin.
  const cycles = await getCycles(project.id);
  const snapshots = await getCycleSnapshots(project.id);

  return (
    <CyclesContent
      key={project.id}
      projectId={project.id}
      projectName={project.name}
      cycles={cycles}
      snapshots={snapshots}
    />
  );
}
