import { getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { CURRENT_USER, DEFAULT_TEAM } from "@/lib/app-shell-data";
import { IssueWorkspace } from "@/components/board/issue-workspace";

// Bu route artık her istekte canlı SQLite state'i okuyor — build-time statik
// üretim denemesine mahal vermemek için açıkça dinamik olarak işaretleniyor.
export const dynamic = "force-dynamic";

export default async function MyIssuesPage() {
  const [allIssues, users, labels] = await Promise.all([getIssues(), getUsers(), getLabels()]);
  const currentUser = users.find((u) => u.email === CURRENT_USER.email);
  const myIssues = currentUser
    ? allIssues.filter((issue) => issue.assignee?.id === currentUser.id)
    : [];

  return (
    <IssueWorkspace
      titleKey="nav.myIssues"
      teamId={DEFAULT_TEAM.slug}
      issues={myIssues}
      users={users}
      labels={labels}
      defaultAssigneeId={currentUser?.id ?? null}
    />
  );
}
