import { WorkflowSettings } from "@/components/settings/workflow-settings";
import { getProjects } from "@/lib/data/projects";
import { getAllWorkflowStates } from "@/lib/data/workflow-states";

export default async function WorkflowSettingsPage() {
  const [projects, states] = await Promise.all([getProjects(), getAllWorkflowStates()]);
  return <WorkflowSettings projects={projects} states={states} />;
}
