import { notFound, redirect } from "next/navigation";
import { WikiView } from "@/components/wiki/wiki-view";
import { getEnabledModuleIds } from "@/lib/data/modules";
import { getProjects, resolveActiveProject } from "@/lib/data/projects";
import { getWikiPage, getWikiTree } from "@/lib/modules/wiki/data";
import { WIKI_MODULE_ID } from "@/lib/modules/wiki/schema";

// Canlı SQLite state'i okuyor — diğer `(app)` rotaları gibi dinamik.
export const dynamic = "force-dynamic";

export default async function WikiRoute({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; page?: string }>;
}) {
  // Rota modül kapalıyken de derleniyor; kapalı bir modüle doğrudan URL ile
  // girilememeli.
  if (!(await getEnabledModuleIds()).includes(WIKI_MODULE_ID)) notFound();

  const { project: projectParam, page: pageParam } = await searchParams;

  const projects = await getProjects();
  const project = resolveActiveProject(projects, projectParam);
  if (project.id !== projectParam) {
    const params = new URLSearchParams({ project: project.id });
    if (pageParam) params.set("page", pageParam);
    redirect(`/wiki?${params.toString()}`);
  }

  const [pages, page] = await Promise.all([
    getWikiTree(project.id),
    pageParam ? getWikiPage(pageParam) : Promise.resolve(null),
  ]);

  // Silinmiş ya da başka projenin sayfası: yönlendirme yok, ana ekran. Silme
  // action'ının yanıtında bu rota yeniden render ediliyor; orada redirect
  // atmak gereksiz bir yönlendirme zinciri doğururdu — istemci zaten kendisi
  // yönlendiriyor.
  const selectedPage = page && page.projectId === project.id ? page : null;

  return (
    <WikiView
      key={project.id}
      projectId={project.id}
      projectName={project.name}
      pages={pages}
      selectedPage={selectedPage}
    />
  );
}
