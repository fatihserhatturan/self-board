import { getCurrentUser, getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { getProjects } from "@/lib/data/projects";
import { getAllWorkflowStates } from "@/lib/data/workflow-states";
import { IssueWorkspace } from "@/components/board/issue-workspace";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function MyIssuesPage() {
  // Durumlar proje başına; bu sayfa projeler-arası olduğu için hepsi çekiliyor.
  // Gruplama yine sistem tipine göre, ama dialog'lar ve sağ tık menüsü
  // issue'nun kendi projesinin durumlarını gösteriyor.
  const [allIssues, users, labels, currentUser, projects, allStates] = await Promise.all([
    getIssues(),
    getUsers(),
    getLabels(),
    getCurrentUser(),
    getProjects(),
    getAllWorkflowStates(),
  ]);
  const myIssues = currentUser
    ? allIssues.filter((issue) => issue.assignee?.id === currentUser.id)
    : [];

  return (
    <IssueWorkspace
      titleKey="nav.myIssues"
      issues={myIssues}
      users={users}
      labels={labels}
      allStates={allStates}
      projects={projects}
      defaultAssigneeId={currentUser?.id ?? null}
    />
  );
}
