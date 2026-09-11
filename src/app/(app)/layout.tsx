import { AppShellProvider } from "@/components/app-shell/app-shell-provider";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { GlobalCreateIssueDialog } from "@/components/app-shell/global-create-issue-dialog";
import { Sidebar } from "@/components/app-shell/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser, getIssues, getLabels, getUsers } from "@/lib/data/issues";
import { getProjects } from "@/lib/data/projects";

// Diğer route'larda olduğu gibi: canlı SQLite state'i okuyoruz, build-time
// statik üretim denemesine mahal vermemek için dinamik olarak işaretliyoruz.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [users, labels, currentUser, issues, projects] = await Promise.all([
    getUsers(),
    getLabels(),
    getCurrentUser(),
    getIssues(),
    getProjects(),
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <AppShellProvider issues={issues} projects={projects} currentUserId={currentUser?.id ?? null}>
        <div className="flex h-full min-h-0">
          <Sidebar currentUser={currentUser} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </div>
        <CommandPalette />
        <GlobalCreateIssueDialog users={users} labels={labels} />
      </AppShellProvider>
    </TooltipProvider>
  );
}
