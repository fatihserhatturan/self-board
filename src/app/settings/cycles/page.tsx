import { CycleSettings } from "@/components/settings/cycle-settings";
import { getProjects } from "@/lib/data/projects";

export default async function CycleSettingsPage() {
  const projects = await getProjects();
  return <CycleSettings projects={projects} />;
}
