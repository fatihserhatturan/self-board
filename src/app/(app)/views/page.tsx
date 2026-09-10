import { redirect } from "next/navigation";
import { getViews } from "@/lib/data/views";
import { getProjects, resolveActiveProject } from "@/lib/data/projects";
import { ViewsContent } from "@/app/(app)/views/views-content";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function ViewsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;

  const projects = await getProjects();
  const project = resolveActiveProject(projects, projectParam);
  if (project.id !== projectParam) {
    redirect(`/views?project=${project.id}`);
  }

  const views = await getViews(project.id);
  return <ViewsContent key={project.id} projectId={project.id} projectName={project.name} views={views} />;
}
