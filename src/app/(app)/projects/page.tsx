import { getProjects } from "@/lib/data/projects";
import { ProjectsContent } from "@/app/(app)/projects/projects-content";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsContent projects={projects} />;
}
