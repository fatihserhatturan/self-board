import { getCurrentUser, getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { IssueWorkspace } from "@/components/board/issue-workspace";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function MyIssuesPage() {
  const [allIssues, users, labels, currentUser] = await Promise.all([
    getIssues(),
    getUsers(),
    getLabels(),
    getCurrentUser(),
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
      defaultAssigneeId={currentUser?.id ?? null}
    />
  );
}
